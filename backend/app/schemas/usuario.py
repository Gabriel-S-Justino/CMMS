from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.common import CamelModel
from app.schemas.empresa import EmpresaResumo


class UsuarioOut(CamelModel):
    id: int
    username: str
    # `str` e não EmailStr: validar e-mail na SAÍDA não protege nada e ainda
    # quebra em domínios reservados (.local) que já estão gravados no banco.
    email: str
    cargo: str | None = None
    # Antes era texto livre digitado no cadastro; agora é a empresa de verdade.
    empresa: EmpresaResumo
    funcao: str | None = None
    perfil: str | None = None
    permissoes: list[str] = []
    ativo: bool
    ultimo_login: datetime | None = None
    criado_em: datetime


class AprovarUsuarioRequest(CamelModel):
    perfil_id: int


class UsuarioUpdate(CamelModel):
    """`empresa_id` não está aqui de propósito: mover usuário de tenant não é
    uma edição de perfil, e permitir isso abriria caminho para escalar acesso."""

    email: EmailStr | None = None
    cargo: str | None = Field(default=None, max_length=100)
    funcao: str | None = Field(default=None, max_length=100)
    perfil_id: int | None = None
    ativo: bool | None = None


class PerfilOut(CamelModel):
    id: int
    nome: str
    descricao: str | None = None
    permissoes: list[str] = []


class PerfilCreate(CamelModel):
    nome: str = Field(min_length=1, max_length=50)
    descricao: str | None = None


class PerfilUpdate(CamelModel):
    nome: str | None = Field(default=None, max_length=50)
    descricao: str | None = None


class PerfilPermissoesRequest(CamelModel):
    """Substitui o conjunto de permissões do perfil pelos códigos informados."""

    permissoes: list[str]


class PermissaoOut(CamelModel):
    id: int
    codigo: str
    descricao: str | None = None
