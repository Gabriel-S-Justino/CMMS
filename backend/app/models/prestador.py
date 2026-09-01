from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Prestador(Base):
    __tablename__ = "prestadores"
    __table_args__ = (
        UniqueConstraint("empresa_id", "cnpj_cpf", name="uq_prestadores_empresa_cnpj_cpf"),
        Index("ix_prestadores_empresa_id", "empresa_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    cnpj_cpf: Mapped[str | None] = mapped_column(String(18))
    telefone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    tipo: Mapped[str | None] = mapped_column(String(10))  # interno | externo

    criado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    atualizado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
