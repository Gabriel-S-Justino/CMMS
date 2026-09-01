"""Importa todos os models para que o Alembic enxergue o metadata completo."""

from app.models.anexo import Anexo
from app.models.ativo import Ativo
from app.models.enums import (
    CategoriaAtivo,
    StatusAtivo,
    StatusManutencao,
    TipoAnexo,
    TipoManutencao,
)
from app.models.log_auditoria import LogAuditoria
from app.models.manutencao import Manutencao
from app.models.manutencao_peca import ManutencaoPeca
from app.models.peca import Peca
from app.models.perfil import Perfil, perfil_permissoes
from app.models.permissao import Permissao
from app.models.plano_preventiva import PlanoPreventiva
from app.models.prestador import Prestador
from app.models.refresh_token import RefreshToken
from app.models.token_recuperacao import TokenRecuperacaoSenha
from app.models.usuario import Usuario

__all__ = [
    "Anexo",
    "Ativo",
    "CategoriaAtivo",
    "LogAuditoria",
    "Manutencao",
    "ManutencaoPeca",
    "Peca",
    "Perfil",
    "Permissao",
    "PlanoPreventiva",
    "Prestador",
    "RefreshToken",
    "StatusAtivo",
    "StatusManutencao",
    "TipoAnexo",
    "TipoManutencao",
    "TokenRecuperacaoSenha",
    "Usuario",
    "perfil_permissoes",
]
