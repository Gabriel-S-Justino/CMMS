from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = (Index("ix_refresh_tokens_usuario_id", "usuario_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revogado: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
