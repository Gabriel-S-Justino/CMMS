from datetime import datetime
from typing import Any

from pydantic import field_validator

from app.schemas.common import CamelModel


class LogAuditoriaOut(CamelModel):
    id: int
    usuario_id: int | None = None
    acao: str
    tabela: str | None = None
    registro_id: int | None = None
    dados_antes: dict[str, Any] | None = None
    dados_depois: dict[str, Any] | None = None
    ip: str | None = None
    criado_em: datetime

    @field_validator("ip", mode="before")
    @classmethod
    def _ip_para_string(cls, valor: Any) -> str | None:
        # A coluna é INET: o psycopg devolve IPv4Address/IPv6Address, não str.
        return None if valor is None else str(valor)
