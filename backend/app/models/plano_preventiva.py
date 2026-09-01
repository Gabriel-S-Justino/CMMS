from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PlanoPreventiva(Base):
    __tablename__ = "planos_preventiva"
    __table_args__ = (
        CheckConstraint(
            "(intervalo_dias IS NOT NULL) <> (intervalo_horas IS NOT NULL)",
            name="ck_planos_preventiva_um_intervalo",
        ),
        Index("ix_planos_preventiva_empresa_id", "empresa_id"),
        Index("ix_planos_preventiva_ativo_id", "ativo_id"),
        Index(
            "ix_planos_preventiva_proxima_prevista",
            "proxima_prevista",
            postgresql_where="ativo = true",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    ativo_id: Mapped[int] = mapped_column(ForeignKey("ativos.id", ondelete="CASCADE"), nullable=False)
    descricao: Mapped[str] = mapped_column(String(200), nullable=False)
    intervalo_dias: Mapped[int | None] = mapped_column(Integer)
    intervalo_horas: Mapped[int | None] = mapped_column(Integer)
    ultima_execucao: Mapped[date | None] = mapped_column(Date)
    proxima_prevista: Mapped[date | None] = mapped_column(Date)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)

    criado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
