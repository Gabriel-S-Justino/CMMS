from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Numeric,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import (
    NOME_ENUM_STATUS_MANUTENCAO,
    NOME_ENUM_TIPO_MANUTENCAO,
    StatusManutencao,
    TipoManutencao,
    valores,
)


class Manutencao(Base):
    __tablename__ = "manutencoes"
    __table_args__ = (
        Index("ix_manutencoes_empresa_id", "empresa_id"),
        Index("ix_manutencoes_ativo_data", "ativo_id", "data_servico"),
        Index("ix_manutencoes_prestador_id", "prestador_id"),
        Index("ix_manutencoes_tipo", "tipo"),
        Index("ix_manutencoes_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    ativo_id: Mapped[int] = mapped_column(ForeignKey("ativos.id"), nullable=False)
    prestador_id: Mapped[int | None] = mapped_column(ForeignKey("prestadores.id"))
    tipo: Mapped[TipoManutencao] = mapped_column(
        SAEnum(TipoManutencao, name=NOME_ENUM_TIPO_MANUTENCAO, values_callable=valores),
        nullable=False,
    )
    status: Mapped[StatusManutencao] = mapped_column(
        SAEnum(StatusManutencao, name=NOME_ENUM_STATUS_MANUTENCAO, values_callable=valores),
        nullable=False,
        default=StatusManutencao.aberta,
        server_default=StatusManutencao.aberta.value,
    )
    descricao: Mapped[str | None] = mapped_column(Text)
    data_abertura: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    data_servico: Mapped[date | None] = mapped_column(Date)
    data_conclusao: Mapped[date | None] = mapped_column(Date)
    horimetro_no_servico: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    custo_mao_de_obra: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0")
    # Somatório de manutencao_pecas, recalculado pelo service
    custo_pecas: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0")
    custo_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0")

    criado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    atualizado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    pecas: Mapped[list["ManutencaoPeca"]] = relationship(
        back_populates="manutencao", cascade="all, delete-orphan", lazy="selectin"
    )
