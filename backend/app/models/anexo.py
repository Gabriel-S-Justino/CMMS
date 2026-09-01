from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import NOME_ENUM_TIPO_ANEXO, TipoAnexo, valores


class Anexo(Base):
    __tablename__ = "anexos"
    __table_args__ = (
        CheckConstraint(
            "manutencao_id IS NOT NULL OR ativo_id IS NOT NULL",
            name="ck_anexos_tem_dono",
        ),
        Index("ix_anexos_empresa_id", "empresa_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    manutencao_id: Mapped[int | None] = mapped_column(
        ForeignKey("manutencoes.id", ondelete="CASCADE")
    )
    ativo_id: Mapped[int | None] = mapped_column(ForeignKey("ativos.id", ondelete="CASCADE"))
    tipo: Mapped[TipoAnexo] = mapped_column(
        SAEnum(TipoAnexo, name=NOME_ENUM_TIPO_ANEXO, values_callable=valores), nullable=False
    )
    # UUID.ext — o arquivo vive fora do webroot, num volume Docker.
    caminho_arquivo: Mapped[str] = mapped_column(Text, nullable=False)
    nome_original: Mapped[str | None] = mapped_column(String(255))
    mime_type: Mapped[str | None] = mapped_column(String(100))
    tamanho_bytes: Mapped[int | None] = mapped_column(Integer)
    enviado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
