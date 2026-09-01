from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Perfil de plataforma: administra empresas e usuários, não opera o CMMS.
PERFIL_SUPERADMIN = "superadmin"


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (Index("ix_usuarios_empresa_id", "empresa_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    # username e email seguem globais: o login é único no sistema inteiro, não
    # por empresa, senão não daria para saber em qual tenant autenticar.
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(Text, nullable=False)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    cargo: Mapped[str | None] = mapped_column(String(100))
    funcao: Mapped[str | None] = mapped_column(String(100))
    perfil_id: Mapped[int | None] = mapped_column(ForeignKey("perfis.id"))
    # false = cadastro aguardando aprovação de um admin
    ativo: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    ultimo_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Bloqueio por tentativas de login (spec §6): 5 senhas erradas => 15 min parado.
    tentativas_falhas: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    bloqueado_ate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    perfil: Mapped["Perfil | None"] = relationship(back_populates="usuarios", lazy="selectin")
    empresa: Mapped["Empresa"] = relationship(lazy="selectin")

    @property
    def permissoes(self) -> list[str]:
        """Códigos de permissão do perfil do usuário (vazio enquanto não aprovado)."""
        if self.perfil is None:
            return []
        return sorted(p.codigo for p in self.perfil.permissoes)

    def tem_permissao(self, codigo: str) -> bool:
        return codigo in self.permissoes

    @property
    def eh_superadmin(self) -> bool:
        """Superadmin enxerga todas as empresas; qualquer outro fica no seu tenant."""
        return self.perfil is not None and self.perfil.nome == PERFIL_SUPERADMIN
