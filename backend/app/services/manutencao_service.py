"""Regras de manutenção: custos derivados e a restrição do perfil funcionario."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.manutencao import Manutencao
from app.models.manutencao_peca import ManutencaoPeca
from app.models.usuario import Usuario


def recalcular_custos(db: Session, manutencao: Manutencao) -> None:
    """custo_pecas = soma dos itens; custo_total = mão de obra + peças."""
    itens = db.scalars(
        select(ManutencaoPeca).where(ManutencaoPeca.manutencao_id == manutencao.id)
    ).all()

    total_pecas = sum(
        (item.quantidade * item.custo_unitario_na_data for item in itens), Decimal("0")
    )

    manutencao.custo_pecas = total_pecas
    manutencao.custo_total = (manutencao.custo_mao_de_obra or Decimal("0")) + total_pecas


def pode_editar(usuario: Usuario, manutencao: Manutencao) -> bool:
    """Regra do código (não é permissão): funcionario só edita o que ele criou."""
    perfil = usuario.perfil.nome if usuario.perfil else None

    if perfil == "funcionario":
        return manutencao.criado_por == usuario.id

    return True
