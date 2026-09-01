from datetime import datetime

from pydantic import Field

from app.schemas.common import CamelModel


class EmpresaResumo(CamelModel):
    """O mínimo que o front precisa saber da empresa da sessão."""

    id: int
    nome: str


class EmpresaOut(CamelModel):
    id: int
    nome: str
    cnpj: str | None = None
    codigo_convite: str
    ativo: bool
    criado_em: datetime


class EmpresaMinhaOut(CamelModel):
    """`GET /empresas/minha`.

    `codigoConvite` só vem preenchido para quem pode convidar (admin da empresa
    ou superadmin); para os demais fica nulo.
    """

    id: int
    nome: str
    codigo_convite: str | None = None


class EmpresaCreate(CamelModel):
    nome: str = Field(min_length=1, max_length=150)
    cnpj: str | None = Field(default=None, max_length=18)


class EmpresaUpdate(CamelModel):
    nome: str | None = Field(default=None, min_length=1, max_length=150)
    cnpj: str | None = Field(default=None, max_length=18)
    ativo: bool | None = None
