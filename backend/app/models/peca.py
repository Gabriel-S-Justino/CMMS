from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Peca(Base):
    __tablename__ = "pecas"
    __table_args__ = (
        UniqueConstraint("empresa_id", "codigo", name="uq_pecas_empresa_codigo"),
        Index("ix_pecas_empresa_id", "empresa_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    codigo: Mapped[str | None] = mapped_column(String(50))
    unidade: Mapped[str | None] = mapped_column(String(10))  # un, kg, l, m
    custo_unitario_atual: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    estoque: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0")

    criado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    atualizado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
