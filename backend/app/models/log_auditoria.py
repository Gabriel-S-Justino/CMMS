from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LogAuditoria(Base):
    __tablename__ = "logs_auditoria"
    __table_args__ = (
        Index("ix_logs_auditoria_tabela_registro", "tabela", "registro_id"),
        Index("ix_logs_auditoria_usuario_criado", "usuario_id", "criado_em"),
        Index("ix_logs_auditoria_empresa_id", "empresa_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    # Nullable: um login falho de username inexistente não tem empresa conhecida.
    empresa_id: Mapped[int | None] = mapped_column(ForeignKey("empresas.id"))
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    # insert | update | delete | login | login_falho | aprovacao
    acao: Mapped[str] = mapped_column(String(20), nullable=False)
    tabela: Mapped[str | None] = mapped_column(String(50))
    registro_id: Mapped[int | None] = mapped_column(Integer)
    dados_antes: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    dados_depois: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    ip: Mapped[str | None] = mapped_column(INET)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
