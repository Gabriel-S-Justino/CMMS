from datetime import datetime
from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.common import CamelModel


class PrestadorOut(CamelModel):
    id: int
    nome: str
    cnpj_cpf: str | None = None
    telefone: str | None = None
    # Mesmo motivo do UsuarioOut: EmailStr só na entrada.
    email: str | None = None
    tipo: str | None = None
    criado_em: datetime


class PrestadorCreate(CamelModel):
    nome: str = Field(min_length=1, max_length=150)
    cnpj_cpf: str | None = Field(default=None, max_length=18)
    telefone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    tipo: Literal["interno", "externo"] | None = None


class PrestadorUpdate(CamelModel):
    nome: str | None = Field(default=None, max_length=150)
    cnpj_cpf: str | None = Field(default=None, max_length=18)
    telefone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    tipo: Literal["interno", "externo"] | None = None
