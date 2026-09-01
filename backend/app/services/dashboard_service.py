"""Métricas da home. Não existe tabela de métricas: tudo é agregação na hora."""

from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.ativo import Ativo
from app.models.enums import StatusAtivo, StatusManutencao
from app.models.manutencao import Manutencao
from app.models.usuario import Usuario
from app.schemas.dashboard import DashboardMetric


def _formatar_reais(valor: Decimal) -> str:
    # 8420.5 -> "R$ 8.420,50"
    inteiro, _, centavos = f"{valor:.2f}".partition(".")
    with_pontos = f"{int(inteiro):,}".replace(",", ".")
    return f"R$ {with_pontos},{centavos}"


def metricas(db: Session, usuario: Usuario, empresa_id: int) -> list[DashboardMetric]:
    """Mesmos ids que o MOCK_METRICS do front: assets, open, alerts, cost.

    Toda agregação é da empresa do escopo — nunca do sistema inteiro.
    """
    total_ativos = (
        db.scalar(select(func.count()).select_from(Ativo).where(Ativo.empresa_id == empresa_id))
        or 0
    )

    manutencoes_abertas = (
        db.scalar(
            select(func.count())
            .select_from(Manutencao)
            .where(
                Manutencao.empresa_id == empresa_id,
                Manutencao.status.in_(
                    [StatusManutencao.aberta, StatusManutencao.em_andamento]
                ),
            )
        )
        or 0
    )

    alertas = (
        db.scalar(
            select(func.count())
            .select_from(Ativo)
            .where(Ativo.empresa_id == empresa_id, Ativo.status == StatusAtivo.alert)
        )
        or 0
    )

    resultado = [
        DashboardMetric(id="assets", label="Ativos cadastrados", value=str(total_ativos)),
        DashboardMetric(id="open", label="Manutenções em aberto", value=str(manutencoes_abertas)),
        DashboardMetric(id="alerts", label="Alertas ativos", value=str(alertas)),
    ]

    # `cost` só sai para quem tem custos.ver (spec §4).
    if usuario.tem_permissao("custos.ver"):
        hoje = date.today()
        custo_mes = db.scalar(
            select(func.coalesce(func.sum(Manutencao.custo_total), 0)).where(
                Manutencao.empresa_id == empresa_id,
                Manutencao.data_servico.is_not(None),
                func.extract("year", Manutencao.data_servico) == hoje.year,
                func.extract("month", Manutencao.data_servico) == hoje.month,
            )
        ) or Decimal("0")

        resultado.append(
            DashboardMetric(id="cost", label="Custo do mês", value=_formatar_reais(Decimal(custo_mes)))
        )

    return resultado
