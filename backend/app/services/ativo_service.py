"""Consulta e escrita de ativos, incluindo os dois campos calculados que o front usa."""

from datetime import date
from typing import Any

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.ativo import Ativo
from app.models.manutencao import Manutencao
from app.models.plano_preventiva import PlanoPreventiva
from app.schemas.ativo import AtivoOut

# Campos que, se vierem no corpo, vão para `especificacoes` (JSONB) e não para coluna.
CAMPOS_ESPECIFICACOES = {
    "placa",
    "renavam",
    "chassi",
    "combustivel",
    "potencia",
    "tensao",
    "capacidade",
}


def _subquery_ultima_manutencao(empresa_id: int):
    """MAX(manutencoes.data_servico) por ativo — vira `lastMaintenanceDate`."""
    return (
        select(
            Manutencao.ativo_id.label("ativo_id"),
            func.max(Manutencao.data_servico).label("ultima"),
        )
        .where(Manutencao.empresa_id == empresa_id)
        .group_by(Manutencao.ativo_id)
        .subquery()
    )


def _subquery_atrasados(empresa_id: int):
    """Ativos com plano preventivo ativo e vencido — vira `isMaintenanceOverdue`."""
    return (
        select(PlanoPreventiva.ativo_id.label("ativo_id"))
        .where(
            PlanoPreventiva.empresa_id == empresa_id,
            PlanoPreventiva.ativo.is_(True),
            PlanoPreventiva.proxima_prevista.is_not(None),
            PlanoPreventiva.proxima_prevista < date.today(),
        )
        .distinct()
        .subquery()
    )


def _query_listagem(empresa_id: int) -> Select[Any]:
    """Já nasce filtrada por empresa: as subqueries também, para o join não
    cruzar dados de outro tenant."""
    ultima = _subquery_ultima_manutencao(empresa_id)
    atrasados = _subquery_atrasados(empresa_id)

    return (
        select(
            Ativo,
            ultima.c.ultima.label("ultima_manutencao"),
            (atrasados.c.ativo_id.is_not(None)).label("manutencao_atrasada"),
        )
        .outerjoin(ultima, ultima.c.ativo_id == Ativo.id)
        .outerjoin(atrasados, atrasados.c.ativo_id == Ativo.id)
        .where(Ativo.empresa_id == empresa_id)
    )


def listar(
    db: Session,
    empresa_id: int,
    *,
    status: str | None = None,
    busca: str | None = None,
    page: int = 1,
    tamanho_pagina: int = 50,
) -> list[AtivoOut]:
    """Retorna a lista da empresa, no formato do `type Asset` do front."""
    query = _query_listagem(empresa_id)

    if status:
        query = query.where(Ativo.status == status)

    if busca:
        termo = f"%{busca.strip()}%"
        query = query.where(
            or_(
                Ativo.nome.ilike(termo),
                Ativo.codigo.ilike(termo),
                Ativo.patrimonio.ilike(termo),
                Ativo.localizacao.ilike(termo),
            )
        )

    query = query.order_by(Ativo.nome).limit(tamanho_pagina).offset((page - 1) * tamanho_pagina)

    return [
        AtivoOut(
            id=str(ativo.id),
            name=ativo.nome,
            category=ativo.categoria,
            type=ativo.tipo,
            location=ativo.localizacao,
            status=ativo.status,
            last_maintenance_date=ultima,
            is_maintenance_overdue=bool(atrasada),
        )
        for ativo, ultima, atrasada in db.execute(query).all()
    ]


def contar(db: Session, empresa_id: int) -> int:
    return (
        db.scalar(select(func.count()).select_from(Ativo).where(Ativo.empresa_id == empresa_id))
        or 0
    )


def calculados(db: Session, ativo_id: int, empresa_id: int) -> tuple[date | None, bool]:
    """(ultima_manutencao, manutencao_atrasada) de um ativo só."""
    ultima = db.scalar(
        select(func.max(Manutencao.data_servico)).where(
            Manutencao.ativo_id == ativo_id, Manutencao.empresa_id == empresa_id
        )
    )

    atrasada = db.scalar(
        select(func.count())
        .select_from(PlanoPreventiva)
        .where(
            PlanoPreventiva.ativo_id == ativo_id,
            PlanoPreventiva.empresa_id == empresa_id,
            PlanoPreventiva.ativo.is_(True),
            PlanoPreventiva.proxima_prevista.is_not(None),
            PlanoPreventiva.proxima_prevista < date.today(),
        )
    )

    return ultima, bool(atrasada)


def separar_especificacoes(dados: dict[str, Any]) -> dict[str, Any]:
    """Move placa/renavam/chassi/... do corpo plano para dentro de `especificacoes`.

    Campos não informados são descartados em vez de virarem `null` no JSONB.
    """
    especificacoes = dict(dados.pop("especificacoes", None) or {})

    for campo in list(dados):
        if campo not in CAMPOS_ESPECIFICACOES:
            continue

        valor = dados.pop(campo)
        if valor is not None:
            especificacoes[campo] = valor

    dados["especificacoes"] = especificacoes
    return dados
