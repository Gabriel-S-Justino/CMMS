from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.common import CamelModel


class PecaOut(CamelModel):
    id: int
    nome: str
    codigo: str | None = None
    unidade: str | None = None
    custo_unitario_atual: Decimal | None = None
    estoque: Decimal
    criado_em: datetime


class PecaCreate(CamelModel):
    nome: str = Field(min_length=1, max_length=150)
    codigo: str | None = Field(default=None, max_length=50)
    unidade: str | None = Field(default=None, max_length=10)
    custo_unitario_atual: Decimal | None = None
    estoque: Decimal = Decimal("0")


class PecaUpdate(CamelModel):
    nome: str | None = Field(default=None, max_length=150)
    codigo: str | None = Field(default=None, max_length=50)
    unidade: str | None = Field(default=None, max_length=10)
    custo_unitario_atual: Decimal | None = None
    estoque: Decimal | None = None
