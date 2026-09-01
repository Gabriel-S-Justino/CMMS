"""Bloqueio de conta por tentativas de login falhas.

Acrescenta em `usuarios`:
  - tentativas_falhas: contador de senhas erradas seguidas (zera no login ok)
  - bloqueado_ate: instante até o qual o login fica recusado com HTTP 423

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "usuarios",
        sa.Column(
            "tentativas_falhas",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "usuarios",
        sa.Column("bloqueado_ate", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("usuarios", "bloqueado_ate")
    op.drop_column("usuarios", "tentativas_falhas")
