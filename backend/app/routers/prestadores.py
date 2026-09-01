"""CRUD de prestadores (spec §4)."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import auditoria
from app.core.database import get_db
from app.core.permissions import requer
from app.core.tenant import escopo_empresa, obter_do_escopo
from app.models.manutencao import Manutencao
from app.models.prestador import Prestador
from app.models.usuario import Usuario
from app.schemas.prestador import PrestadorCreate, PrestadorOut, PrestadorUpdate

router = APIRouter(prefix="/prestadores", tags=["prestadores"])


@router.get("", response_model=list[PrestadorOut])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("prestadores.ver")),
    empresa_id: int = Depends(escopo_empresa),
) -> list[PrestadorOut]:
    return [
        PrestadorOut.model_validate(p)
        for p in db.scalars(
            select(Prestador)
            .where(Prestador.empresa_id == empresa_id)
            .order_by(Prestador.nome)
        )
    ]


@router.post("", response_model=PrestadorOut, status_code=status.HTTP_201_CREATED)
def criar(
    corpo: PrestadorCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("prestadores.criar")),
    empresa_id: int = Depends(escopo_empresa),
) -> PrestadorOut:
    prestador = Prestador(
        **corpo.model_dump(), empresa_id=empresa_id,
        criado_por=usuario.id, atualizado_por=usuario.id,
    )
    db.add(prestador)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe um prestador com este CNPJ/CPF."
        ) from None

    auditoria.registrar(
        db, acao="insert", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="prestadores",
        registro_id=prestador.id, dados_depois=auditoria.snapshot(prestador), request=request,
    )
    db.commit()
    db.refresh(prestador)

    return PrestadorOut.model_validate(prestador)


@router.patch("/{prestador_id}", response_model=PrestadorOut)
def atualizar(
    prestador_id: int,
    corpo: PrestadorUpdate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("prestadores.editar")),
    empresa_id: int = Depends(escopo_empresa),
) -> PrestadorOut:
    prestador = _obter(db, prestador_id, empresa_id)
    antes = auditoria.snapshot(prestador)

    for campo, valor in corpo.model_dump(exclude_unset=True).items():
        setattr(prestador, campo, valor)

    prestador.atualizado_por = usuario.id

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="prestadores",
        registro_id=prestador.id, dados_antes=antes,
        dados_depois=auditoria.snapshot(prestador), request=request,
    )
    db.commit()
    db.refresh(prestador)

    return PrestadorOut.model_validate(prestador)


@router.delete("/{prestador_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(
    prestador_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("prestadores.deletar")),
    empresa_id: int = Depends(escopo_empresa),
) -> Response:
    prestador = _obter(db, prestador_id, empresa_id)
    antes = auditoria.snapshot(prestador)

    em_uso = db.scalar(
        select(Manutencao.id)
        .where(Manutencao.prestador_id == prestador.id, Manutencao.empresa_id == empresa_id)
        .limit(1)
    )
    if em_uso is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Prestador está vinculado a manutenções e não pode ser excluído.",
        )

    db.delete(prestador)
    auditoria.registrar(
        db, acao="delete", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="prestadores",
        registro_id=prestador_id, dados_antes=antes, request=request,
    )
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _obter(db: Session, prestador_id: int, empresa_id: int) -> Prestador:
    return obter_do_escopo(
        db, Prestador, prestador_id, empresa_id, nao_encontrado="Prestador não encontrado."
    )
