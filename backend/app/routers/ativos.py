"""Rotas de ativos: listagem da `home.tsx` e formulário de `cadAtivos.tsx`."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import auditoria
from app.core.database import get_db
from app.core.permissions import requer
from app.models.ativo import Ativo
from app.models.enums import StatusAtivo
from app.models.manutencao import Manutencao
from app.models.plano_preventiva import PlanoPreventiva
from app.models.usuario import Usuario
from app.schemas.ativo import AtivoCreate, AtivoDetalheOut, AtivoOut, AtivoUpdate
from app.services import ativo_service

router = APIRouter(prefix="/ativos", tags=["ativos"])


@router.get("", response_model=list[AtivoOut])
def listar(
    status_filtro: StatusAtivo | None = Query(default=None, alias="status"),
    busca: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("ativos.ver")),
) -> list[AtivoOut]:
    return ativo_service.listar(
        db,
        status=status_filtro.value if status_filtro else None,
        busca=busca,
        page=page,
    )


@router.post("", response_model=AtivoDetalheOut, status_code=status.HTTP_201_CREATED)
def criar(
    corpo: AtivoCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("ativos.criar")),
) -> AtivoDetalheOut:
    dados = ativo_service.separar_especificacoes(corpo.model_dump())

    ativo = Ativo(**dados, criado_por=usuario.id, atualizado_por=usuario.id)
    db.add(ativo)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe um ativo com este código."
        ) from None

    auditoria.registrar(
        db, acao="insert", usuario_id=usuario.id, tabela="ativos", registro_id=ativo.id,
        dados_depois=auditoria.snapshot(ativo), request=request,
    )
    db.commit()
    db.refresh(ativo)

    return _detalhe(db, ativo)


@router.get("/{ativo_id}", response_model=AtivoDetalheOut)
def detalhar(
    ativo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("ativos.ver")),
) -> AtivoDetalheOut:
    return _detalhe(db, _obter(db, ativo_id))


@router.patch("/{ativo_id}", response_model=AtivoDetalheOut)
def atualizar(
    ativo_id: int,
    corpo: AtivoUpdate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("ativos.editar")),
) -> AtivoDetalheOut:
    ativo = _obter(db, ativo_id)
    antes = auditoria.snapshot(ativo)

    dados = corpo.model_dump(exclude_unset=True)
    especificacoes_novas = ativo_service.separar_especificacoes(dados).pop("especificacoes")

    for campo, valor in dados.items():
        setattr(ativo, campo, valor)

    if especificacoes_novas:
        # Mescla: enviar só `placa` não apaga `renavam`.
        ativo.especificacoes = {**(ativo.especificacoes or {}), **especificacoes_novas}

    ativo.atualizado_por = usuario.id

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe um ativo com este código."
        ) from None

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, tabela="ativos", registro_id=ativo.id,
        dados_antes=antes, dados_depois=auditoria.snapshot(ativo), request=request,
    )
    db.commit()
    db.refresh(ativo)

    return _detalhe(db, ativo)


@router.delete("/{ativo_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(
    ativo_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("ativos.deletar")),
) -> Response:
    ativo = _obter(db, ativo_id)
    antes = auditoria.snapshot(ativo)

    tem_manutencao = db.scalar(select(Manutencao.id).where(Manutencao.ativo_id == ativo.id).limit(1))
    if tem_manutencao is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ativo possui manutenções registradas e não pode ser excluído.",
        )

    db.delete(ativo)
    auditoria.registrar(
        db, acao="delete", usuario_id=usuario.id, tabela="ativos", registro_id=ativo_id,
        dados_antes=antes, request=request,
    )
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Auxiliares -------------------------------------------------------------

def _obter(db: Session, ativo_id: int) -> Ativo:
    ativo = db.get(Ativo, ativo_id)
    if ativo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ativo não encontrado.")
    return ativo


def _detalhe(db: Session, ativo: Ativo) -> AtivoDetalheOut:
    ultima, atrasada = ativo_service.calculados(db, ativo.id)

    manutencoes = db.scalars(
        select(Manutencao)
        .where(Manutencao.ativo_id == ativo.id)
        .order_by(Manutencao.data_servico.desc().nullslast(), Manutencao.id.desc())
        .limit(10)
    ).all()

    planos = db.scalars(
        select(PlanoPreventiva).where(PlanoPreventiva.ativo_id == ativo.id)
    ).all()

    return AtivoDetalheOut(
        **{
            coluna.key: getattr(ativo, coluna.key)
            for coluna in ativo.__table__.columns
            if coluna.key not in {"criado_por", "atualizado_por"}
        },
        criado_por=ativo.criado_por,
        atualizado_por=ativo.atualizado_por,
        ultima_manutencao=ultima,
        manutencao_atrasada=atrasada,
        manutencoes=[
            {
                "id": m.id,
                "tipo": m.tipo.value,
                "status": m.status.value,
                "descricao": m.descricao,
                "data_servico": m.data_servico,
                "custo_total": m.custo_total,
            }
            for m in manutencoes
        ],
        planos=[
            {
                "id": p.id,
                "descricao": p.descricao,
                "intervalo_dias": p.intervalo_dias,
                "intervalo_horas": p.intervalo_horas,
                "ultima_execucao": p.ultima_execucao,
                "proxima_prevista": p.proxima_prevista,
                "ativo": p.ativo,
            }
            for p in planos
        ],
    )
