"""Planos de manutenção preventiva (spec §4)."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import auditoria
from app.core.database import get_db
from app.core.permissions import requer
from app.core.tenant import escopo_empresa, obter_do_escopo
from app.models.ativo import Ativo
from app.models.plano_preventiva import PlanoPreventiva
from app.models.usuario import Usuario
from app.schemas.plano import PlanoCreate, PlanoExecutarRequest, PlanoOut, PlanoUpdate
from app.services import plano_service

router = APIRouter(prefix="/planos", tags=["planos"])


@router.get("", response_model=list[PlanoOut])
def listar(
    ativo_id: int | None = Query(default=None, alias="ativoId"),
    apenas_ativos: bool = Query(default=False, alias="apenasAtivos"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("planos.ver")),
    empresa_id: int = Depends(escopo_empresa),
) -> list[PlanoOut]:
    query = select(PlanoPreventiva).where(PlanoPreventiva.empresa_id == empresa_id)

    if ativo_id is not None:
        query = query.where(PlanoPreventiva.ativo_id == ativo_id)
    if apenas_ativos:
        query = query.where(PlanoPreventiva.ativo.is_(True))

    query = query.order_by(PlanoPreventiva.proxima_prevista.asc().nullslast())

    return [PlanoOut.model_validate(p) for p in db.scalars(query)]


@router.post("", response_model=PlanoOut, status_code=status.HTTP_201_CREATED)
def criar(
    corpo: PlanoCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("planos.criar")),
    empresa_id: int = Depends(escopo_empresa),
) -> PlanoOut:
    # O ativo apontado tem de ser da mesma empresa, senão 404.
    obter_do_escopo(
        db, Ativo, corpo.ativo_id, empresa_id, nao_encontrado="Ativo não encontrado."
    )

    plano = PlanoPreventiva(**corpo.model_dump(), empresa_id=empresa_id, criado_por=usuario.id)

    # Sem data prevista explícita, calcula a partir da última execução (ou de hoje).
    if plano.proxima_prevista is None:
        plano.proxima_prevista = plano_service.proxima_data(
            plano, plano.ultima_execucao or date.today()
        )

    db.add(plano)
    db.flush()

    auditoria.registrar(
        db, acao="insert", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="planos_preventiva",
        registro_id=plano.id, dados_depois=auditoria.snapshot(plano), request=request,
    )
    db.commit()
    db.refresh(plano)

    return PlanoOut.model_validate(plano)


@router.patch("/{plano_id}", response_model=PlanoOut)
def atualizar(
    plano_id: int,
    corpo: PlanoUpdate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("planos.editar")),
    empresa_id: int = Depends(escopo_empresa),
) -> PlanoOut:
    plano = _obter(db, plano_id, empresa_id)
    antes = auditoria.snapshot(plano)

    for campo, valor in corpo.model_dump(exclude_unset=True).items():
        setattr(plano, campo, valor)

    if (plano.intervalo_dias is None) == (plano.intervalo_horas is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe exatamente um entre intervaloDias e intervaloHoras.",
        )

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="planos_preventiva",
        registro_id=plano.id, dados_antes=antes,
        dados_depois=auditoria.snapshot(plano), request=request,
    )
    db.commit()
    db.refresh(plano)

    return PlanoOut.model_validate(plano)


@router.delete("/{plano_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(
    plano_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("planos.deletar")),
    empresa_id: int = Depends(escopo_empresa),
) -> Response:
    plano = _obter(db, plano_id, empresa_id)
    antes = auditoria.snapshot(plano)

    db.delete(plano)
    auditoria.registrar(
        db, acao="delete", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="planos_preventiva",
        registro_id=plano_id, dados_antes=antes, request=request,
    )
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{plano_id}/executar", response_model=PlanoOut)
def executar(
    plano_id: int,
    corpo: PlanoExecutarRequest,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("planos.editar")),
    empresa_id: int = Depends(escopo_empresa),
) -> PlanoOut:
    """Marca a execução e recalcula a próxima data prevista."""
    plano = _obter(db, plano_id, empresa_id)
    antes = auditoria.snapshot(plano)

    plano_service.executar(plano, corpo.data_execucao or date.today())

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="planos_preventiva",
        registro_id=plano.id, dados_antes=antes,
        dados_depois=auditoria.snapshot(plano), request=request,
    )
    db.commit()
    db.refresh(plano)

    return PlanoOut.model_validate(plano)


def _obter(db: Session, plano_id: int, empresa_id: int) -> PlanoPreventiva:
    return obter_do_escopo(
        db, PlanoPreventiva, plano_id, empresa_id, nao_encontrado="Plano não encontrado."
    )
