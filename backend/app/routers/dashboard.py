"""Métricas da `home.tsx` (spec §4)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import requer
from app.core.tenant import escopo_empresa
from app.models.usuario import Usuario
from app.schemas.dashboard import DashboardMetric
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metricas", response_model=list[DashboardMetric])
def metricas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("dashboard.ver")),
    empresa_id: int = Depends(escopo_empresa),
) -> list[DashboardMetric]:
    return dashboard_service.metricas(db, usuario, empresa_id)
