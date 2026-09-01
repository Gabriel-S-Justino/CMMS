"""Base dos schemas: tudo entra/sai em camelCase, como o front espera."""

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    """Serializa em camelCase e também aceita snake_case na entrada."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class MensagemResponse(CamelModel):
    mensagem: str


class Paginacao(CamelModel, Generic[T]):
    itens: list[T]
    total: int
    page: int
    tamanho_pagina: int
