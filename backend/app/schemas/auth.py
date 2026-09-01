from pydantic import EmailStr, Field

from app.schemas.common import CamelModel
from app.schemas.empresa import EmpresaResumo


class LoginRequest(CamelModel):
    username: str = Field(min_length=1, max_length=50)
    senha: str = Field(min_length=1, max_length=128)


class UsuarioSessao(CamelModel):
    """O que o front guarda no auth-context depois do login."""

    id: int
    username: str
    perfil: str | None = None
    permissoes: list[str] = []
    empresa: EmpresaResumo


class TokenResponse(CamelModel):
    access_token: str
    refresh_token: str
    usuario: UsuarioSessao


class RefreshRequest(CamelModel):
    refresh_token: str


class RefreshResponse(CamelModel):
    access_token: str
    refresh_token: str


class RegistroRequest(CamelModel):
    """Corresponde ao formulário de `view/cadUser/cadUser.tsx`.

    `codigoConvite` substituiu o antigo campo livre `empresa`: agora a empresa
    não é digitada, é resolvida pelo código que o administrador dela forneceu.
    """

    username: str = Field(min_length=3, max_length=50)
    cargo: str = Field(min_length=1, max_length=100)
    codigo_convite: str = Field(min_length=1, max_length=32)
    funcao: str = Field(min_length=1, max_length=100)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)


class RecuperarSenhaRequest(CamelModel):
    email: EmailStr


class RedefinirSenhaRequest(CamelModel):
    token: str
    nova_senha: str = Field(min_length=8, max_length=128)
