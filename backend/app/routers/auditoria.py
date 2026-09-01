"""Consulta dos logs de auditoria (spec §4). Só admin."""

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import requer
from app.core.tenant import escopo_empresa_admin
from app.models.log_auditoria import LogAuditoria
from app.models.usuario import Usuario
from app.schemas.auditoria import LogAuditoriaOut

router = APIRouter(prefix="/auditoria", tags=["auditoria"])


@router.get("", response_model=list[LogAuditoriaOut])
def listar(
    tabela: str | None = Query(default=None),
    usuario_id: int | None = Query(default=None, alias="usuarioId"),
    de: date | None = Query(default=None),
    ate: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("auditoria.ver")),
    empresa_id: int | None = Depends(escopo_empresa_admin),
) -> list[LogAuditoriaOut]:
    query = select(LogAuditoria)

    # Admin vê só o log da própria empresa; superadmin (empresa_id None) vê tudo.
    if empresa_id is not None:
        query = query.where(LogAuditoria.empresa_id == empresa_id)

    if tabela:
        query = query.where(LogAuditoria.tabela == tabela)
    if usuario_id is not None:
        query = query.where(LogAuditoria.usuario_id == usuario_id)
    if de is not None:
        query = query.where(LogAuditoria.criado_em >= datetime.combine(de, time.min))
    if ate is not None:
        query = query.where(LogAuditoria.criado_em <= datetime.combine(ate, time.max))

    query = query.order_by(LogAuditoria.criado_em.desc()).limit(100).offset((page - 1) * 100)

    return [LogAuditoriaOut.model_validate(log) for log in db.scalars(query)]
