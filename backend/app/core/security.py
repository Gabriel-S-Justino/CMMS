"""Hash de senha (argon2) e emissão/validação de tokens (JWT HS256)."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from jose import JWTError, jwt

from app.core.config import settings

_hasher = PasswordHasher()


# --- Senhas -----------------------------------------------------------------

def hash_senha(senha: str) -> str:
    return _hasher.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        _hasher.verify(senha_hash, senha)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
    return True


def precisa_rehash(senha_hash: str) -> bool:
    """True quando os parâmetros do argon2 mudaram e o hash deve ser regravado."""
    try:
        return _hasher.check_needs_rehash(senha_hash)
    except InvalidHashError:
        return True


# --- JWT --------------------------------------------------------------------

def _criar_token(dados: dict[str, Any], expira_em: timedelta) -> str:
    payload = dados.copy()
    agora = datetime.now(UTC)
    payload.update({"iat": agora, "exp": agora + expira_em})
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def criar_access_token(usuario_id: int) -> str:
    return _criar_token(
        {"sub": str(usuario_id), "tipo": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def criar_download_token(anexo_id: int) -> str:
    """Token curto que assina uma URL de download de anexo."""
    return _criar_token(
        {"sub": str(anexo_id), "tipo": "download"},
        timedelta(minutes=settings.DOWNLOAD_TOKEN_EXPIRE_MINUTES),
    )


def decodificar_token(token: str, tipo_esperado: str) -> dict[str, Any] | None:
    """Devolve o payload se o token for válido e do tipo certo; senão, None."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None

    if payload.get("tipo") != tipo_esperado:
        return None

    return payload


# --- Tokens opacos (refresh e recuperação de senha) -------------------------
# São strings aleatórias guardadas no banco só como hash. sha256 (e não argon2)
# porque a busca precisa ser determinística e o token já tem entropia alta.

def gerar_token_opaco() -> str:
    return secrets.token_urlsafe(48)


def hash_token_opaco(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
