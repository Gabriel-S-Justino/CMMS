"""Autenticação e autorização por permissão.

Uso nas rotas:

    @router.post("/ativos", dependencies=[Depends(requer("ativos.criar"))])
"""

from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decodificar_token
from app.models.usuario import Usuario

bearer = HTTPBearer(auto_error=False)


def usuario_logado(
    credenciais: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    """Resolve o usuário do Bearer token. 401 se não der."""
    nao_autorizado = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credenciais is None or not credenciais.credentials:
        raise nao_autorizado

    payload = decodificar_token(credenciais.credentials, tipo_esperado="access")
    if payload is None:
        raise nao_autorizado

    try:
        usuario_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise nao_autorizado from None

    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise nao_autorizado

    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cadastro aguardando aprovação.",
        )

    return usuario


def requer(codigo: str) -> Callable[[Usuario], Usuario]:
    """Fábrica de dependência que exige uma permissão específica."""

    def verificar(usuario: Usuario = Depends(usuario_logado)) -> Usuario:
        if not usuario.tem_permissao(codigo):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permissão negada: {codigo}.",
            )
        return usuario

    return verificar
