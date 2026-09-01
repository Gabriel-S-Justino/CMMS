from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import (
    NOME_ENUM_CATEGORIA,
    NOME_ENUM_STATUS_ATIVO,
    CategoriaAtivo,
    StatusAtivo,
    valores,
)


class Ativo(Base):
    __tablename__ = "ativos"
    __table_args__ = (
        Index("ix_ativos_status", "status"),
        Index("ix_ativos_categoria", "categoria"),
        Index("ix_ativos_localizacao", "localizacao"),
        Index("ix_ativos_especificacoes", "especificacoes", postgresql_using="gin"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    # --- Identificação (etapa 1 do cadAtivos) ---
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    categoria: Mapped[CategoriaAtivo] = mapped_column(
        SAEnum(CategoriaAtivo, name=NOME_ENUM_CATEGORIA, values_callable=valores),
        nullable=False,
    )
    tipo: Mapped[str | None] = mapped_column(String(80))
    codigo: Mapped[str | None] = mapped_column(String(50), unique=True)
    patrimonio: Mapped[str | None] = mapped_column(String(50))

    # --- Características ---
    fabricante: Mapped[str | None] = mapped_column(String(100))
    modelo: Mapped[str | None] = mapped_column(String(100))
    ano: Mapped[int | None] = mapped_column(SmallInteger)
    numero_serie: Mapped[str | None] = mapped_column(String(100))

    # --- Operação ---
    localizacao: Mapped[str | None] = mapped_column(String(150))
    responsavel: Mapped[str | None] = mapped_column(String(150))
    status: Mapped[StatusAtivo] = mapped_column(
        SAEnum(StatusAtivo, name=NOME_ENUM_STATUS_ATIVO, values_callable=valores),
        nullable=False,
        default=StatusAtivo.operational,
        server_default=StatusAtivo.operational.value,
    )
    horimetro_atual: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    quilometragem: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))

    # --- Aquisição ---
    data_aquisicao: Mapped[date | None] = mapped_column(Date)
    fornecedor: Mapped[str | None] = mapped_column(String(150))
    valor_aquisicao: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    numero_nota_fiscal: Mapped[str | None] = mapped_column(String(60))
    garantia_ate: Mapped[date | None] = mapped_column(Date)
    observacoes: Mapped[str | None] = mapped_column(Text)

    # --- Específicos por categoria ---
    # veículo: placa, renavam, chassi, combustivel
    # máquina/equipamento: potencia, tensao, capacidade
    especificacoes: Mapped[dict[str, Any]] = mapped_column(
        JSONB, default=dict, server_default="{}", nullable=False
    )

    # --- Auditoria ---
    criado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    atualizado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
