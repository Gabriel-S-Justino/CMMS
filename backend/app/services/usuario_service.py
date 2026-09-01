"""Consultas e aprovação de usuários."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.perfil import Perfil
from app.models.usuario import Usuario


def listar(
    db: Session, empresa_id: int | None = None, *, pendentes: bool | None = None
) -> list[Usuario]:
    """`empresa_id=None` só é usado pelo superadmin, que enxerga todas as empresas."""
    query = select(Usuario).order_by(Usuario.criado_em.desc())

    if empresa_id is not None:
        query = query.where(Usuario.empresa_id == empresa_id)

    if pendentes is True:
        query = query.where(Usuario.ativo.is_(False))
    elif pendentes is False:
        query = query.where(Usuario.ativo.is_(True))

    return list(db.scalars(query))


def aprovar(db: Session, usuario: Usuario, perfil_id: int) -> Usuario:
    perfil = db.get(Perfil, perfil_id)
    if perfil is None:
        raise ValueError("Perfil não encontrado.")

    usuario.perfil_id = perfil.id
    usuario.ativo = True
    return usuario


def para_saida(usuario: Usuario) -> dict:
    """Achata o perfil em string, do jeito que o front espera."""
    return {
        "id": usuario.id,
        "username": usuario.username,
        "email": usuario.email,
        "cargo": usuario.cargo,
        "empresa": {"id": usuario.empresa_id, "nome": usuario.empresa.nome},
        "funcao": usuario.funcao,
        "perfil": usuario.perfil.nome if usuario.perfil else None,
        "permissoes": usuario.permissoes,
        "ativo": usuario.ativo,
        "ultimo_login": usuario.ultimo_login,
        "criado_em": usuario.criado_em,
    }
