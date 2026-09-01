from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ManutencaoPeca(Base):
    __tablename__ = "manutencao_pecas"

    manutencao_id: Mapped[int] = mapped_column(
        ForeignKey("manutencoes.id", ondelete="CASCADE"), primary_key=True
    )
    peca_id: Mapped[int] = mapped_column(ForeignKey("pecas.id"), primary_key=True)
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # Congelado no momento do uso: o preço da peça pode mudar depois.
    custo_unitario_na_data: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    manutencao: Mapped["Manutencao"] = relationship(back_populates="pecas")
