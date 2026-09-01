from __future__ import annotations

import secrets
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# Alfabeto sem caracteres ambíguos (0/O, 1/I/L): o código é ditado por telefone
# e digitado à mão na tela de cadastro.
ALFABETO_CONVITE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
TAMANHO_CONVITE = 12


def gerar_codigo_convite() -> str:
    """Código aleatório de 12 caracteres. ~59 bits: não dá para adivinhar."""
    return "".join(secrets.choice(ALFABETO_CONVITE) for _ in range(TAMANHO_CONVITE))


class Empresa(Base):
    """Tenant do sistema. Todo dado operacional pertence a exatamente uma."""

    __tablename__ = "empresas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    cnpj: Mapped[str | None] = mapped_column(String(18), unique=True)
    # Quem tem o código consegue solicitar cadastro na empresa (ainda depende de
    # aprovação de um admin). Regenerável a qualquer momento.
    codigo_convite: Mapped[str] = mapped_column(
        String(TAMANHO_CONVITE), unique=True, nullable=False, default=gerar_codigo_convite
    )
    ativo: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
