"""CRUD de peças (spec §4)."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import auditoria
from app.core.database import get_db
from app.core.permissions import requer
from app.core.tenant import escopo_empresa, obter_do_escopo
from app.models.manutencao_peca import ManutencaoPeca
from app.models.peca import Peca
from app.models.usuario import Usuario
from app.schemas.peca import PecaCreate, PecaOut, PecaUpdate

router = APIRouter(prefix="/pecas", tags=["pecas"])


@router.get("", response_model=list[PecaOut])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("pecas.ver")),
    empresa_id: int = Depends(escopo_empresa),
) -> list[PecaOut]:
    return [
        PecaOut.model_validate(p)
        for p in db.scalars(
            select(Peca).where(Peca.empresa_id == empresa_id).order_by(Peca.nome)
        )
    ]


@router.post("", response_model=PecaOut, status_code=status.HTTP_201_CREATED)
def criar(
    corpo: PecaCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("pecas.criar")),
    empresa_id: int = Depends(escopo_empresa),
) -> PecaOut:
    peca = Peca(
        **corpo.model_dump(), empresa_id=empresa_id,
        criado_por=usuario.id, atualizado_por=usuario.id,
    )
    db.add(peca)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe uma peça com este código."
        ) from None

    auditoria.registrar(
        db, acao="insert", usuario_id=usuario.id, empresa_id=empresa_id, tabela="pecas", registro_id=peca.id,
        dados_depois=auditoria.snapshot(peca), request=request,
    )
    db.commit()
    db.refresh(peca)

    return PecaOut.model_validate(peca)


@router.patch("/{peca_id}", response_model=PecaOut)
def atualizar(
    peca_id: int,
    corpo: PecaUpdate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("pecas.editar")),
    empresa_id: int = Depends(escopo_empresa),
) -> PecaOut:
    peca = _obter(db, peca_id, empresa_id)
    antes = auditoria.snapshot(peca)

    for campo, valor in corpo.model_dump(exclude_unset=True).items():
        setattr(peca, campo, valor)

    peca.atualizado_por = usuario.id

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, empresa_id=empresa_id, tabela="pecas", registro_id=peca.id,
        dados_antes=antes, dados_depois=auditoria.snapshot(peca), request=request,
    )
    db.commit()
    db.refresh(peca)

    return PecaOut.model_validate(peca)


@router.delete("/{peca_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(
    peca_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("pecas.deletar")),
    empresa_id: int = Depends(escopo_empresa),
) -> Response:
    peca = _obter(db, peca_id, empresa_id)
    antes = auditoria.snapshot(peca)

    em_uso = db.scalar(select(ManutencaoPeca.peca_id).where(ManutencaoPeca.peca_id == peca.id).limit(1))
    if em_uso is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Peça já foi usada em manutenções e não pode ser excluída.",
        )

    db.delete(peca)
    auditoria.registrar(
        db, acao="delete", usuario_id=usuario.id, empresa_id=empresa_id, tabela="pecas", registro_id=peca_id,
        dados_antes=antes, request=request,
    )
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _obter(db: Session, peca_id: int, empresa_id: int) -> Peca:
    return obter_do_escopo(
        db, Peca, peca_id, empresa_id, nao_encontrado="Peça não encontrada."
    )
