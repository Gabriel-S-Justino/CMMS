"""Seed idempotente: perfis, permissões e o admin inicial.

Roda com:  python -m seeds.perfis_permissoes
Pode rodar quantas vezes quiser — nada é duplicado.

A matriz de permissões é exatamente a da tabela da seção 2.3 da spec.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_senha
from app.models.perfil import Perfil
from app.models.permissao import Permissao
from app.models.usuario import Usuario

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

PERFIS: dict[str, tuple[str, list[str]]] = {
    "admin": ("Acesso total ao sistema", ADMIN),
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


def semear_admin(db: Session, perfis: dict[str, Perfil]) -> tuple[Usuario, bool]:
    """Cria o admin do .env se ainda não existir. Devolve (usuario, foi_criado)."""
    admin = db.scalar(select(Usuario).where(Usuario.username == settings.ADMIN_USERNAME))

    if admin is not None:
        # Nunca sobrescreve a senha de um admin que já existe.
        admin.perfil_id = perfis["admin"].id
        admin.ativo = True
        db.flush()
        return admin, False

    admin = Usuario(
        username=settings.ADMIN_USERNAME,
        email=settings.ADMIN_EMAIL,
        senha_hash=hash_senha(settings.ADMIN_PASSWORD),
        cargo="Administrador",
        empresa="CMMS",
        funcao="Administrador do sistema",
        perfil_id=perfis["admin"].id,
        ativo=True,
    )
    db.add(admin)
    db.flush()
    return admin, True


def main() -> None:
    with SessionLocal() as db:
        permissoes = semear_permissoes(db)
        perfis = semear_perfis(db, permissoes)
        admin, criado = semear_admin(db, perfis)
        db.commit()

        print(f"Permissões: {len(permissoes)}")
        print(f"Perfis: {', '.join(sorted(perfis))}")
        print(
            f"Admin '{admin.username}' "
            + ("criado." if criado else "já existia — senha preservada.")
        )


if __name__ == "__main__":
    main()
