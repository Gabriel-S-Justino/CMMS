"""Schema inicial do CMMS — já multi-tenant.

Cria os enums e as tabelas da spec (docs/cmms-backend-spec.md §2 e §8):

  empresas -> perfis -> permissoes -> perfil_permissoes -> usuarios ->
  refresh_tokens -> tokens_recuperacao_senha -> logs_auditoria -> ativos ->
  prestadores -> pecas -> manutencoes -> manutencao_pecas ->
  planos_preventiva -> anexos

Substitui as antigas 0001 (single-tenant) e 0002 (bloqueio por conta): o banco
ainda não tinha ido a lugar nenhum, então em vez de empilhar um ALTER atrás do
outro o schema nasce inteiro aqui, com `empresa_id` em toda tabela operacional
e os UNIQUE já compostos por empresa.

Revision ID: 0001
Revises:
Create Date: 2026-09-01
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('empresas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=150), nullable=False),
    sa.Column('cnpj', sa.String(length=18), nullable=True),
    sa.Column('codigo_convite', sa.String(length=12), nullable=False),
    sa.Column('ativo', sa.Boolean(), server_default='true', nullable=False),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('cnpj'),
    sa.UniqueConstraint('codigo_convite')
    )
    op.create_table('perfis',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=50), nullable=False),
    sa.Column('descricao', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nome')
    )
    op.create_table('permissoes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('codigo', sa.String(length=80), nullable=False),
    sa.Column('descricao', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('codigo')
    )
    op.create_table('perfil_permissoes',
    sa.Column('perfil_id', sa.Integer(), nullable=False),
    sa.Column('permissao_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['perfil_id'], ['perfis.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['permissao_id'], ['permissoes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('perfil_id', 'permissao_id')
    )
    op.create_table('usuarios',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=50), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('senha_hash', sa.Text(), nullable=False),
    sa.Column('empresa_id', sa.Integer(), nullable=False),
    sa.Column('cargo', sa.String(length=100), nullable=True),
    sa.Column('funcao', sa.String(length=100), nullable=True),
    sa.Column('perfil_id', sa.Integer(), nullable=True),
    sa.Column('ativo', sa.Boolean(), server_default='false', nullable=False),
    sa.Column('ultimo_login', sa.DateTime(timezone=True), nullable=True),
    sa.Column('tentativas_falhas', sa.Integer(), server_default='0', nullable=False),
    sa.Column('bloqueado_ate', sa.DateTime(timezone=True), nullable=True),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('atualizado_em', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.ForeignKeyConstraint(['perfil_id'], ['perfis.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('username')
    )
    op.create_index('ix_usuarios_empresa_id', 'usuarios', ['empresa_id'], unique=False)
    op.create_table('ativos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('empresa_id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=150), nullable=False),
    sa.Column('categoria', sa.Enum('vehicle', 'industrialMachine', 'equipment', 'electrical', 'infrastructure', 'other', name='categoria_ativo'), nullable=False),
    sa.Column('tipo', sa.String(length=80), nullable=True),
    sa.Column('codigo', sa.String(length=50), nullable=True),
    sa.Column('patrimonio', sa.String(length=50), nullable=True),
    sa.Column('fabricante', sa.String(length=100), nullable=True),
    sa.Column('modelo', sa.String(length=100), nullable=True),
    sa.Column('ano', sa.SmallInteger(), nullable=True),
    sa.Column('numero_serie', sa.String(length=100), nullable=True),
    sa.Column('localizacao', sa.String(length=150), nullable=True),
    sa.Column('responsavel', sa.String(length=150), nullable=True),
    sa.Column('status', sa.Enum('operational', 'maintenance', 'stopped', 'alert', name='status_ativo'), server_default='operational', nullable=False),
    sa.Column('horimetro_atual', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('quilometragem', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('data_aquisicao', sa.Date(), nullable=True),
    sa.Column('fornecedor', sa.String(length=150), nullable=True),
    sa.Column('valor_aquisicao', sa.Numeric(precision=14, scale=2), nullable=True),
    sa.Column('numero_nota_fiscal', sa.String(length=60), nullable=True),
    sa.Column('garantia_ate', sa.Date(), nullable=True),
    sa.Column('observacoes', sa.Text(), nullable=True),
    sa.Column('especificacoes', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
    sa.Column('criado_por', sa.Integer(), nullable=True),
    sa.Column('atualizado_por', sa.Integer(), nullable=True),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('atualizado_em', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['atualizado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['criado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('empresa_id', 'codigo', name='uq_ativos_empresa_codigo'),
    sa.UniqueConstraint('empresa_id', 'patrimonio', name='uq_ativos_empresa_patrimonio')
    )
    op.create_index('ix_ativos_categoria', 'ativos', ['categoria'], unique=False)
    op.create_index('ix_ativos_empresa_id', 'ativos', ['empresa_id'], unique=False)
    op.create_index('ix_ativos_especificacoes', 'ativos', ['especificacoes'], unique=False, postgresql_using='gin')
    op.create_index('ix_ativos_localizacao', 'ativos', ['localizacao'], unique=False)
    op.create_index('ix_ativos_status', 'ativos', ['status'], unique=False)
    op.create_table('logs_auditoria',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('empresa_id', sa.Integer(), nullable=True),
    sa.Column('usuario_id', sa.Integer(), nullable=True),
    sa.Column('acao', sa.String(length=20), nullable=False),
    sa.Column('tabela', sa.String(length=50), nullable=True),
    sa.Column('registro_id', sa.Integer(), nullable=True),
    sa.Column('dados_antes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('dados_depois', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('ip', postgresql.INET(), nullable=True),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_logs_auditoria_empresa_id', 'logs_auditoria', ['empresa_id'], unique=False)
    op.create_index('ix_logs_auditoria_tabela_registro', 'logs_auditoria', ['tabela', 'registro_id'], unique=False)
    op.create_index('ix_logs_auditoria_usuario_criado', 'logs_auditoria', ['usuario_id', 'criado_em'], unique=False)
    op.create_table('pecas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('empresa_id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=150), nullable=False),
    sa.Column('codigo', sa.String(length=50), nullable=True),
    sa.Column('unidade', sa.String(length=10), nullable=True),
    sa.Column('custo_unitario_atual', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('estoque', sa.Numeric(precision=12, scale=2), server_default='0', nullable=False),
    sa.Column('criado_por', sa.Integer(), nullable=True),
    sa.Column('atualizado_por', sa.Integer(), nullable=True),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('atualizado_em', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['atualizado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['criado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('empresa_id', 'codigo', name='uq_pecas_empresa_codigo')
    )
    op.create_index('ix_pecas_empresa_id', 'pecas', ['empresa_id'], unique=False)
    op.create_table('prestadores',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('empresa_id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=150), nullable=False),
    sa.Column('cnpj_cpf', sa.String(length=18), nullable=True),
    sa.Column('telefone', sa.String(length=20), nullable=True),
    sa.Column('email', sa.String(length=255), nullable=True),
    sa.Column('tipo', sa.String(length=10), nullable=True),
    sa.Column('criado_por', sa.Integer(), nullable=True),
    sa.Column('atualizado_por', sa.Integer(), nullable=True),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('atualizado_em', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['atualizado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['criado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('empresa_id', 'cnpj_cpf', name='uq_prestadores_empresa_cnpj_cpf')
    )
    op.create_index('ix_prestadores_empresa_id', 'prestadores', ['empresa_id'], unique=False)
    op.create_table('refresh_tokens',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('usuario_id', sa.Integer(), nullable=False),
    sa.Column('token_hash', sa.Text(), nullable=False),
    sa.Column('expira_em', sa.DateTime(timezone=True), nullable=False),
    sa.Column('revogado', sa.Boolean(), server_default='false', nullable=False),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('token_hash')
    )
    op.create_index('ix_refresh_tokens_usuario_id', 'refresh_tokens', ['usuario_id'], unique=False)
    op.create_table('tokens_recuperacao_senha',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('usuario_id', sa.Integer(), nullable=False),
    sa.Column('token_hash', sa.Text(), nullable=False),
    sa.Column('expira_em', sa.DateTime(timezone=True), nullable=False),
    sa.Column('usado', sa.Boolean(), server_default='false', nullable=False),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('token_hash')
    )
    op.create_table('manutencoes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('empresa_id', sa.Integer(), nullable=False),
    sa.Column('ativo_id', sa.Integer(), nullable=False),
    sa.Column('prestador_id', sa.Integer(), nullable=True),
    sa.Column('tipo', sa.Enum('preventiva', 'corretiva', 'preditiva', name='tipo_manutencao'), nullable=False),
    sa.Column('status', sa.Enum('aberta', 'em_andamento', 'concluida', 'cancelada', name='status_manutencao'), server_default='aberta', nullable=False),
    sa.Column('descricao', sa.Text(), nullable=True),
    sa.Column('data_abertura', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('data_servico', sa.Date(), nullable=True),
    sa.Column('data_conclusao', sa.Date(), nullable=True),
    sa.Column('horimetro_no_servico', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('custo_mao_de_obra', sa.Numeric(precision=12, scale=2), server_default='0', nullable=False),
    sa.Column('custo_pecas', sa.Numeric(precision=12, scale=2), server_default='0', nullable=False),
    sa.Column('custo_total', sa.Numeric(precision=12, scale=2), server_default='0', nullable=False),
    sa.Column('criado_por', sa.Integer(), nullable=True),
    sa.Column('atualizado_por', sa.Integer(), nullable=True),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('atualizado_em', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['ativo_id'], ['ativos.id'], ),
    sa.ForeignKeyConstraint(['atualizado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['criado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.ForeignKeyConstraint(['prestador_id'], ['prestadores.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_manutencoes_ativo_data', 'manutencoes', ['ativo_id', 'data_servico'], unique=False)
    op.create_index('ix_manutencoes_empresa_id', 'manutencoes', ['empresa_id'], unique=False)
    op.create_index('ix_manutencoes_prestador_id', 'manutencoes', ['prestador_id'], unique=False)
    op.create_index('ix_manutencoes_status', 'manutencoes', ['status'], unique=False)
    op.create_index('ix_manutencoes_tipo', 'manutencoes', ['tipo'], unique=False)
    op.create_table('planos_preventiva',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('empresa_id', sa.Integer(), nullable=False),
    sa.Column('ativo_id', sa.Integer(), nullable=False),
    sa.Column('descricao', sa.String(length=200), nullable=False),
    sa.Column('intervalo_dias', sa.Integer(), nullable=True),
    sa.Column('intervalo_horas', sa.Integer(), nullable=True),
    sa.Column('ultima_execucao', sa.Date(), nullable=True),
    sa.Column('proxima_prevista', sa.Date(), nullable=True),
    sa.Column('ativo', sa.Boolean(), server_default='true', nullable=False),
    sa.Column('criado_por', sa.Integer(), nullable=True),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('(intervalo_dias IS NOT NULL) <> (intervalo_horas IS NOT NULL)', name='ck_planos_preventiva_um_intervalo'),
    sa.ForeignKeyConstraint(['ativo_id'], ['ativos.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['criado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_planos_preventiva_ativo_id', 'planos_preventiva', ['ativo_id'], unique=False)
    op.create_index('ix_planos_preventiva_empresa_id', 'planos_preventiva', ['empresa_id'], unique=False)
    op.create_index('ix_planos_preventiva_proxima_prevista', 'planos_preventiva', ['proxima_prevista'], unique=False, postgresql_where='ativo = true')
    op.create_table('anexos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('empresa_id', sa.Integer(), nullable=False),
    sa.Column('manutencao_id', sa.Integer(), nullable=True),
    sa.Column('ativo_id', sa.Integer(), nullable=True),
    sa.Column('tipo', sa.Enum('foto', 'nota_fiscal', 'laudo', 'orcamento', 'outro', name='tipo_anexo'), nullable=False),
    sa.Column('caminho_arquivo', sa.Text(), nullable=False),
    sa.Column('nome_original', sa.String(length=255), nullable=True),
    sa.Column('mime_type', sa.String(length=100), nullable=True),
    sa.Column('tamanho_bytes', sa.Integer(), nullable=True),
    sa.Column('enviado_por', sa.Integer(), nullable=True),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('manutencao_id IS NOT NULL OR ativo_id IS NOT NULL', name='ck_anexos_tem_dono'),
    sa.ForeignKeyConstraint(['ativo_id'], ['ativos.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ),
    sa.ForeignKeyConstraint(['enviado_por'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['manutencao_id'], ['manutencoes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_anexos_empresa_id', 'anexos', ['empresa_id'], unique=False)
    op.create_table('manutencao_pecas',
    sa.Column('manutencao_id', sa.Integer(), nullable=False),
    sa.Column('peca_id', sa.Integer(), nullable=False),
    sa.Column('quantidade', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('custo_unitario_na_data', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.ForeignKeyConstraint(['manutencao_id'], ['manutencoes.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['peca_id'], ['pecas.id'], ),
    sa.PrimaryKeyConstraint('manutencao_id', 'peca_id')
    )


def downgrade() -> None:
    op.drop_table('manutencao_pecas')
    op.drop_index('ix_anexos_empresa_id', table_name='anexos')
    op.drop_table('anexos')
    op.drop_index('ix_planos_preventiva_proxima_prevista', table_name='planos_preventiva', postgresql_where='ativo = true')
    op.drop_index('ix_planos_preventiva_empresa_id', table_name='planos_preventiva')
    op.drop_index('ix_planos_preventiva_ativo_id', table_name='planos_preventiva')
    op.drop_table('planos_preventiva')
    op.drop_index('ix_manutencoes_tipo', table_name='manutencoes')
    op.drop_index('ix_manutencoes_status', table_name='manutencoes')
    op.drop_index('ix_manutencoes_prestador_id', table_name='manutencoes')
    op.drop_index('ix_manutencoes_empresa_id', table_name='manutencoes')
    op.drop_index('ix_manutencoes_ativo_data', table_name='manutencoes')
    op.drop_table('manutencoes')
    op.drop_table('tokens_recuperacao_senha')
    op.drop_index('ix_refresh_tokens_usuario_id', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    op.drop_index('ix_prestadores_empresa_id', table_name='prestadores')
    op.drop_table('prestadores')
    op.drop_index('ix_pecas_empresa_id', table_name='pecas')
    op.drop_table('pecas')
    op.drop_index('ix_logs_auditoria_usuario_criado', table_name='logs_auditoria')
    op.drop_index('ix_logs_auditoria_tabela_registro', table_name='logs_auditoria')
    op.drop_index('ix_logs_auditoria_empresa_id', table_name='logs_auditoria')
    op.drop_table('logs_auditoria')
    op.drop_index('ix_ativos_status', table_name='ativos')
    op.drop_index('ix_ativos_localizacao', table_name='ativos')
    op.drop_index('ix_ativos_especificacoes', table_name='ativos', postgresql_using='gin')
    op.drop_index('ix_ativos_empresa_id', table_name='ativos')
    op.drop_index('ix_ativos_categoria', table_name='ativos')
    op.drop_table('ativos')
    op.drop_index('ix_usuarios_empresa_id', table_name='usuarios')
    op.drop_table('usuarios')
    op.drop_table('perfil_permissoes')
    op.drop_table('permissoes')
    op.drop_table('perfis')
    op.drop_table('empresas')
