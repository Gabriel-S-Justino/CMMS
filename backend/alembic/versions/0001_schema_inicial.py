"""Schema inicial do CMMS.

Cria os enums e as tabelas na ordem da spec (docs/cmms-backend-spec.md §2):
perfis -> permissoes -> perfil_permissoes -> usuarios -> refresh_tokens ->
tokens_recuperacao_senha -> logs_auditoria -> ativos -> prestadores -> pecas ->
manutencoes -> manutencao_pecas -> planos_preventiva -> anexos

Revision ID: 0001
Revises:
Create Date: 2026-09-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Os valores string são os MESMOS que o frontend usa.
categoria_ativo = postgresql.ENUM(
    "vehicle",
    "industrialMachine",
    "equipment",
    "electrical",
    "infrastructure",
    "other",
    name="categoria_ativo",
    create_type=False,
)
status_ativo = postgresql.ENUM(
    "operational", "maintenance", "stopped", "alert", name="status_ativo", create_type=False
)
tipo_manutencao = postgresql.ENUM(
    "preventiva", "corretiva", "preditiva", name="tipo_manutencao", create_type=False
)
status_manutencao = postgresql.ENUM(
    "aberta", "em_andamento", "concluida", "cancelada",
    name="status_manutencao", create_type=False,
)
tipo_anexo = postgresql.ENUM(
    "foto", "nota_fiscal", "laudo", "orcamento", "outro", name="tipo_anexo", create_type=False
)

TODOS_OS_ENUMS = (
    categoria_ativo,
    status_ativo,
    tipo_manutencao,
    status_manutencao,
    tipo_anexo,
)


def upgrade() -> None:
    bind = op.get_bind()
    for enum in TODOS_OS_ENUMS:
        enum.create(bind, checkfirst=True)

    # --- 1. perfis ---
    op.create_table(
        "perfis",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=50), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome"),
    )

    # --- 2. permissoes ---
    op.create_table(
        "permissoes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("codigo", sa.String(length=80), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo"),
    )

    # --- 3. perfil_permissoes ---
    op.create_table(
        "perfil_permissoes",
        sa.Column("perfil_id", sa.Integer(), nullable=False),
        sa.Column("permissao_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["perfil_id"], ["perfis.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["permissao_id"], ["permissoes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("perfil_id", "permissao_id"),
    )

    # --- 4. usuarios ---
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("senha_hash", sa.Text(), nullable=False),
        sa.Column("cargo", sa.String(length=100), nullable=True),
        sa.Column("empresa", sa.String(length=150), nullable=True),
        sa.Column("funcao", sa.String(length=100), nullable=True),
        sa.Column("perfil_id", sa.Integer(), nullable=True),
        sa.Column("ativo", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("ultimo_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["perfil_id"], ["perfis.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("email"),
    )

    # --- 5. refresh_tokens ---
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.Text(), nullable=False),
        sa.Column("expira_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revogado", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_refresh_tokens_usuario_id", "refresh_tokens", ["usuario_id"])

    # --- 6. tokens_recuperacao_senha ---
    op.create_table(
        "tokens_recuperacao_senha",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.Text(), nullable=False),
        sa.Column("expira_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("usado", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )

    # --- 7. logs_auditoria ---
    op.create_table(
        "logs_auditoria",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("acao", sa.String(length=20), nullable=False),
        sa.Column("tabela", sa.String(length=50), nullable=True),
        sa.Column("registro_id", sa.Integer(), nullable=True),
        sa.Column("dados_antes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("dados_depois", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("ip", postgresql.INET(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_logs_auditoria_tabela_registro", "logs_auditoria", ["tabela", "registro_id"])
    op.create_index("ix_logs_auditoria_usuario_criado", "logs_auditoria", ["usuario_id", "criado_em"])

    # --- 8. ativos ---
    op.create_table(
        "ativos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("categoria", categoria_ativo, nullable=False),
        sa.Column("tipo", sa.String(length=80), nullable=True),
        sa.Column("codigo", sa.String(length=50), nullable=True),
        sa.Column("patrimonio", sa.String(length=50), nullable=True),
        sa.Column("fabricante", sa.String(length=100), nullable=True),
        sa.Column("modelo", sa.String(length=100), nullable=True),
        sa.Column("ano", sa.SmallInteger(), nullable=True),
        sa.Column("numero_serie", sa.String(length=100), nullable=True),
        sa.Column("localizacao", sa.String(length=150), nullable=True),
        sa.Column("responsavel", sa.String(length=150), nullable=True),
        sa.Column("status", status_ativo, server_default="operational", nullable=False),
        sa.Column("horimetro_atual", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("quilometragem", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("data_aquisicao", sa.Date(), nullable=True),
        sa.Column("fornecedor", sa.String(length=150), nullable=True),
        sa.Column("valor_aquisicao", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("numero_nota_fiscal", sa.String(length=60), nullable=True),
        sa.Column("garantia_ate", sa.Date(), nullable=True),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column(
            "especificacoes",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("criado_por", sa.Integer(), nullable=True),
        sa.Column("atualizado_por", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["criado_por"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["atualizado_por"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo"),
    )
    op.create_index("ix_ativos_status", "ativos", ["status"])
    op.create_index("ix_ativos_categoria", "ativos", ["categoria"])
    op.create_index("ix_ativos_localizacao", "ativos", ["localizacao"])
    op.create_index(
        "ix_ativos_especificacoes", "ativos", ["especificacoes"], postgresql_using="gin"
    )

    # --- 9. prestadores ---
    op.create_table(
        "prestadores",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("cnpj_cpf", sa.String(length=18), nullable=True),
        sa.Column("telefone", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("tipo", sa.String(length=10), nullable=True),
        sa.Column("criado_por", sa.Integer(), nullable=True),
        sa.Column("atualizado_por", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["criado_por"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["atualizado_por"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cnpj_cpf"),
    )

    # --- 10. pecas ---
    op.create_table(
        "pecas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("codigo", sa.String(length=50), nullable=True),
        sa.Column("unidade", sa.String(length=10), nullable=True),
        sa.Column("custo_unitario_atual", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("estoque", sa.Numeric(precision=12, scale=2), server_default="0", nullable=True),
        sa.Column("criado_por", sa.Integer(), nullable=True),
        sa.Column("atualizado_por", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["criado_por"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["atualizado_por"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo"),
    )

    # --- 11. manutencoes ---
    op.create_table(
        "manutencoes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ativo_id", sa.Integer(), nullable=False),
        sa.Column("prestador_id", sa.Integer(), nullable=True),
        sa.Column("tipo", tipo_manutencao, nullable=False),
        sa.Column("status", status_manutencao, server_default="aberta", nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("data_abertura", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("data_servico", sa.Date(), nullable=True),
        sa.Column("data_conclusao", sa.Date(), nullable=True),
        sa.Column("horimetro_no_servico", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("custo_mao_de_obra", sa.Numeric(precision=12, scale=2), server_default="0", nullable=True),
        sa.Column("custo_pecas", sa.Numeric(precision=12, scale=2), server_default="0", nullable=True),
        sa.Column("custo_total", sa.Numeric(precision=12, scale=2), server_default="0", nullable=True),
        sa.Column("criado_por", sa.Integer(), nullable=True),
        sa.Column("atualizado_por", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["ativo_id"], ["ativos.id"]),
        sa.ForeignKeyConstraint(["prestador_id"], ["prestadores.id"]),
        sa.ForeignKeyConstraint(["criado_por"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["atualizado_por"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_manutencoes_ativo_data", "manutencoes", ["ativo_id", "data_servico"])
    op.create_index("ix_manutencoes_prestador_id", "manutencoes", ["prestador_id"])
    op.create_index("ix_manutencoes_tipo", "manutencoes", ["tipo"])
    op.create_index("ix_manutencoes_status", "manutencoes", ["status"])

    # --- 12. manutencao_pecas ---
    op.create_table(
        "manutencao_pecas",
        sa.Column("manutencao_id", sa.Integer(), nullable=False),
        sa.Column("peca_id", sa.Integer(), nullable=False),
        sa.Column("quantidade", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("custo_unitario_na_data", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(["manutencao_id"], ["manutencoes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["peca_id"], ["pecas.id"]),
        sa.PrimaryKeyConstraint("manutencao_id", "peca_id"),
    )

    # --- 13. planos_preventiva ---
    op.create_table(
        "planos_preventiva",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ativo_id", sa.Integer(), nullable=False),
        sa.Column("descricao", sa.String(length=200), nullable=False),
        sa.Column("intervalo_dias", sa.Integer(), nullable=True),
        sa.Column("intervalo_horas", sa.Integer(), nullable=True),
        sa.Column("ultima_execucao", sa.Date(), nullable=True),
        sa.Column("proxima_prevista", sa.Date(), nullable=True),
        sa.Column("ativo", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("criado_por", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.CheckConstraint(
            "(intervalo_dias IS NOT NULL) <> (intervalo_horas IS NOT NULL)",
            name="ck_planos_preventiva_um_intervalo",
        ),
        sa.ForeignKeyConstraint(["ativo_id"], ["ativos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["criado_por"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_planos_preventiva_ativo_id", "planos_preventiva", ["ativo_id"])
    op.create_index(
        "ix_planos_preventiva_proxima_prevista",
        "planos_preventiva",
        ["proxima_prevista"],
        postgresql_where=sa.text("ativo = true"),
    )

    # --- 14. anexos ---
    op.create_table(
        "anexos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("manutencao_id", sa.Integer(), nullable=True),
        sa.Column("ativo_id", sa.Integer(), nullable=True),
        sa.Column("tipo", tipo_anexo, nullable=False),
        sa.Column("caminho_arquivo", sa.Text(), nullable=False),
        sa.Column("nome_original", sa.String(length=255), nullable=True),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("tamanho_bytes", sa.Integer(), nullable=True),
        sa.Column("enviado_por", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.CheckConstraint(
            "manutencao_id IS NOT NULL OR ativo_id IS NOT NULL", name="ck_anexos_tem_dono"
        ),
        sa.ForeignKeyConstraint(["manutencao_id"], ["manutencoes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ativo_id"], ["ativos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["enviado_por"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    # Ordem inversa da criação.
    op.drop_table("anexos")
    op.drop_index("ix_planos_preventiva_proxima_prevista", table_name="planos_preventiva")
    op.drop_index("ix_planos_preventiva_ativo_id", table_name="planos_preventiva")
    op.drop_table("planos_preventiva")
    op.drop_table("manutencao_pecas")
    op.drop_index("ix_manutencoes_status", table_name="manutencoes")
    op.drop_index("ix_manutencoes_tipo", table_name="manutencoes")
    op.drop_index("ix_manutencoes_prestador_id", table_name="manutencoes")
    op.drop_index("ix_manutencoes_ativo_data", table_name="manutencoes")
    op.drop_table("manutencoes")
    op.drop_table("pecas")
    op.drop_table("prestadores")
    op.drop_index("ix_ativos_especificacoes", table_name="ativos")
    op.drop_index("ix_ativos_localizacao", table_name="ativos")
    op.drop_index("ix_ativos_categoria", table_name="ativos")
    op.drop_index("ix_ativos_status", table_name="ativos")
    op.drop_table("ativos")
    op.drop_index("ix_logs_auditoria_usuario_criado", table_name="logs_auditoria")
    op.drop_index("ix_logs_auditoria_tabela_registro", table_name="logs_auditoria")
    op.drop_table("logs_auditoria")
    op.drop_table("tokens_recuperacao_senha")
    op.drop_index("ix_refresh_tokens_usuario_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_table("usuarios")
    op.drop_table("perfil_permissoes")
    op.drop_table("permissoes")
    op.drop_table("perfis")

    bind = op.get_bind()
    for enum in TODOS_OS_ENUMS:
        enum.drop(bind, checkfirst=True)
