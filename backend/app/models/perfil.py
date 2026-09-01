from __future__ import annotations

from sqlalchemy import ForeignKey, String, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Tabela associativa perfil <-> permissão
perfil_permissoes = Table(
    "perfil_permissoes",
    Base.metadata,
    Column("perfil_id", ForeignKey("perfis.id", ondelete="CASCADE"), primary_key=True),
    Column("permissao_id", ForeignKey("permissoes.id", ondelete="CASCADE"), primary_key=True),
)


class Perfil(Base):
    __tablename__ = "perfis"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column()

    permissoes: Mapped[list["Permissao"]] = relationship(
        secondary=perfil_permissoes, back_populates="perfis", lazy="selectin"
    )
    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="perfil")
