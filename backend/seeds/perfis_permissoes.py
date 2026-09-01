"""Seed idempotente: empresas, perfis, permissões, superadmin e admin inicial.

Roda com:  python -m seeds.perfis_permissoes
Pode rodar quantas vezes quiser — nada é duplicado.

A matriz de permissões é a da tabela da seção 2.3 da spec, mais o perfil
`superadmin` da seção "Multi-tenant".

Cria duas empresas:
  - "Plataforma": onde mora o superadmin. Não tem dado operacional.
  - "Demo": empresa de trabalho, com o admin do .env. O código de convite dela
    é impresso no fim para você cadastrar os primeiros usuários.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_senha
from app.models.empresa import Empresa, gerar_codigo_convite
from app.models.perfil import Perfil
from app.models.permissao import Permissao
from app.models.usuario import PERFIL_SUPERADMIN, Usuario

EMPRESA_PLATAFORMA = "Plataforma"
EMPRESA_DEMO = "Demo"

# --- Permissões: codigo -> descrição ----------------------------------------
PERMISSOES: dict[str, str] = {
    "ativos.ver": "Visualizar ativos",
    "ativos.criar": "Cadastrar ativos",
    "ativos.editar": "Editar ativos",
    "ativos.deletar": "Excluir ativos",
    "manutencoes.ver": "Visualizar manutenções",
    "manutencoes.criar": "Abrir manutenções",
    "manutencoes.editar": "Editar manutenções",
    "manutencoes.deletar": "Excluir manutenções",
    "planos.ver": "Visualizar planos de preventiva",
    "planos.criar": "Criar planos de preventiva",
    "planos.editar": "Editar planos de preventiva",
    "planos.deletar": "Excluir planos de preventiva",
    "prestadores.ver": "Visualizar prestadores",
    "prestadores.criar": "Cadastrar prestadores",
    "prestadores.editar": "Editar prestadores",
    "prestadores.deletar": "Excluir prestadores",
    "pecas.ver": "Visualizar peças",
    "pecas.criar": "Cadastrar peças",
    "pecas.editar": "Editar peças",
    "pecas.deletar": "Excluir peças",
    "anexos.enviar": "Enviar anexos",
    "anexos.deletar": "Excluir anexos",
    "dashboard.ver": "Visualizar o painel",
    "custos.ver": "Visualizar custos",
    "relatorios.exportar": "Exportar relatórios",
    "usuarios.ver": "Visualizar usuários",
    "usuarios.aprovar": "Aprovar cadastros",
    "usuarios.gerenciar": "Gerenciar usuários",
    "perfis.gerenciar": "Gerenciar perfis e permissões",
    "auditoria.ver": "Consultar logs de auditoria",
    "empresas.gerenciar": "Criar e administrar empresas (plataforma)",
}

# --- Perfis: nome -> (descrição, permissões) --------------------------------
LEITURA = [
    "ativos.ver",
    "manutencoes.ver",
    "planos.ver",
    "prestadores.ver",
    "pecas.ver",
    "dashboard.ver",
]

FUNCIONARIO = [
    *LEITURA,
    "manutencoes.criar",
    "manutencoes.editar",
    "anexos.enviar",
]

GERENTE = [
    *FUNCIONARIO,
    "ativos.criar",
    "ativos.editar",
    "ativos.deletar",
    "manutencoes.deletar",
    "planos.criar",
    "planos.editar",
    "planos.deletar",
    "prestadores.criar",
    "prestadores.editar",
    "prestadores.deletar",
    "pecas.criar",
    "pecas.editar",
    "pecas.deletar",
    "anexos.deletar",
    "custos.ver",
    "relatorios.exportar",
    "usuarios.ver",
]

ADMIN = [
    *GERENTE,
    "usuarios.aprovar",
    "usuarios.gerenciar",
    "perfis.gerenciar",
    "auditoria.ver",
]

# Superadmin administra a PLATAFORMA, não o CMMS: cria empresas e mexe em
# usuários de qualquer uma delas. De propósito não tem nenhuma permissão
# operacional — não vê ativo, manutenção nem custo de empresa alguma.
SUPERADMIN = [
    "empresas.gerenciar",
    "usuarios.gerenciar",
]

PERFIS: dict[str, tuple[str, list[str]]] = {
    PERFIL_SUPERADMIN: ("Administra empresas e usuários da plataforma", SUPERADMIN),
    "admin": ("Acesso total à própria empresa", ADMIN),
    "gerente": ("Gerencia ativos, manutenções, cadastros e custos", GERENTE),
    "funcionario": ("Registra e edita as próprias manutenções", FUNCIONARIO),
    "leitura": ("Somente consulta", LEITURA),
}


def semear_permissoes(db: Session) -> dict[str, Permissao]:
    existentes = {p.codigo: p for p in db.scalars(select(Permissao))}

    for codigo, descricao in PERMISSOES.items():
        if codigo in existentes:
            existentes[codigo].descricao = descricao
        else:
            nova = Permissao(codigo=codigo, descricao=descricao)
            db.add(nova)
            existentes[codigo] = nova

    db.flush()
    return existentes


def semear_perfis(db: Session, permissoes: dict[str, Permissao]) -> dict[str, Perfil]:
    existentes = {p.nome: p for p in db.scalars(select(Perfil))}

    for nome, (descricao, codigos) in PERFIS.items():
        perfil = existentes.get(nome)

        if perfil is None:
            perfil = Perfil(nome=nome, descricao=descricao)
            db.add(perfil)
            existentes[nome] = perfil

        perfil.descricao = descricao
        perfil.permissoes = [permissoes[codigo] for codigo in sorted(set(codigos))]

    db.flush()
    return existentes


def semear_empresa(db: Session, nome: str) -> Empresa:
    """Empresa pelo nome, criando se não existir. O código de convite é preservado."""
    empresa = db.scalar(select(Empresa).where(Empresa.nome == nome))

    if empresa is None:
        empresa = Empresa(nome=nome, codigo_convite=gerar_codigo_convite())
        db.add(empresa)
        db.flush()

    return empresa


def semear_usuario(
    db: Session,
    *,
    username: str,
    email: str,
    senha: str,
    perfil: Perfil,
    empresa: Empresa,
    cargo: str,
    funcao: str,
) -> tuple[Usuario, bool]:
    """Cria o usuário se não existir. Devolve (usuario, foi_criado).

    Nunca sobrescreve a senha de quem já existe — rodar o seed de novo não
    ressuscita a senha do .env por cima de uma que já foi trocada.
    """
    usuario = db.scalar(select(Usuario).where(Usuario.username == username))

    if usuario is not None:
        usuario.perfil_id = perfil.id
        usuario.ativo = True
        db.flush()
        return usuario, False

    usuario = Usuario(
        username=username,
        email=email,
        senha_hash=hash_senha(senha),
        cargo=cargo,
        empresa_id=empresa.id,
        funcao=funcao,
        perfil_id=perfil.id,
        ativo=True,
    )
    db.add(usuario)
    db.flush()
    return usuario, True


def main() -> None:
    with SessionLocal() as db:
        permissoes = semear_permissoes(db)
        perfis = semear_perfis(db, permissoes)

        plataforma = semear_empresa(db, EMPRESA_PLATAFORMA)
        demo = semear_empresa(db, EMPRESA_DEMO)

        superadmin, super_criado = semear_usuario(
            db,
            username=settings.SUPERADMIN_USERNAME,
            email=settings.SUPERADMIN_EMAIL,
            senha=settings.SUPERADMIN_PASSWORD,
            perfil=perfis[PERFIL_SUPERADMIN],
            empresa=plataforma,
            cargo="Superadministrador",
            funcao="Administrador da plataforma",
        )

        admin, admin_criado = semear_usuario(
            db,
            username=settings.ADMIN_USERNAME,
            email=settings.ADMIN_EMAIL,
            senha=settings.ADMIN_PASSWORD,
            perfil=perfis["admin"],
            empresa=demo,
            cargo="Administrador",
            funcao="Administrador do sistema",
        )

        db.commit()

        def situacao(criado: bool) -> str:
            return "criado." if criado else "já existia — senha preservada."

        print(f"Permissões: {len(permissoes)}")
        print(f"Perfis: {', '.join(sorted(perfis))}")
        print(f"Empresas: {plataforma.nome}, {demo.nome}")
        print(f"Superadmin '{superadmin.username}' ({plataforma.nome}) {situacao(super_criado)}")
        print(f"Admin '{admin.username}' ({demo.nome}) {situacao(admin_criado)}")
        print()
        print(f"Código de convite da empresa '{demo.nome}': {demo.codigo_convite}")
        print("Use esse código no cadastro para entrar como usuário da empresa.")


if __name__ == "__main__":
    main()
