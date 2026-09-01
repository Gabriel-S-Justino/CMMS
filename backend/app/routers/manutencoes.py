"""Manutenções e as peças usadas em cada uma (spec §4)."""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import auditoria
from app.core.database import get_db
from app.core.permissions import requer
from app.core.tenant import escopo_empresa, obter_do_escopo
from app.models.ativo import Ativo
from app.models.enums import StatusManutencao, TipoManutencao
from app.models.manutencao import Manutencao
from app.models.manutencao_peca import ManutencaoPeca
from app.models.peca import Peca
from app.models.prestador import Prestador
from app.models.usuario import Usuario
from app.schemas.manutencao import (
    ManutencaoCreate,
    ManutencaoOut,
    ManutencaoPecaCreate,
    ManutencaoUpdate,
)
from app.services import manutencao_service

router = APIRouter(prefix="/manutencoes", tags=["manutencoes"])


@router.get("", response_model=list[ManutencaoOut])
def listar(
    ativo_id: int | None = Query(default=None, alias="ativoId"),
    status_filtro: StatusManutencao | None = Query(default=None, alias="status"),
    tipo: TipoManutencao | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("manutencoes.ver")),
    empresa_id: int = Depends(escopo_empresa),
) -> list[ManutencaoOut]:
    query = select(Manutencao).where(Manutencao.empresa_id == empresa_id)

    if ativo_id is not None:
        query = query.where(Manutencao.ativo_id == ativo_id)
    if status_filtro is not None:
        query = query.where(Manutencao.status == status_filtro)
    if tipo is not None:
        query = query.where(Manutencao.tipo == tipo)

    query = (
        query.order_by(Manutencao.data_abertura.desc()).limit(50).offset((page - 1) * 50)
    )

    return [ManutencaoOut.model_validate(m) for m in db.scalars(query)]


@router.post("", response_model=ManutencaoOut, status_code=status.HTTP_201_CREATED)
def criar(
    corpo: ManutencaoCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("manutencoes.criar")),
    empresa_id: int = Depends(escopo_empresa),
) -> ManutencaoOut:
    # Referência cruzada: o ativo (e o prestador, se vier) precisam ser da mesma
    # empresa. Se não forem, 404 — apontar para fora do tenant é indistinguível
    # de apontar para um id que não existe.
    obter_do_escopo(
        db, Ativo, corpo.ativo_id, empresa_id, nao_encontrado="Ativo não encontrado."
    )

    if corpo.prestador_id is not None:
        obter_do_escopo(
            db, Prestador, corpo.prestador_id, empresa_id,
            nao_encontrado="Prestador não encontrado.",
        )

    manutencao = Manutencao(
        **corpo.model_dump(),
        empresa_id=empresa_id,
        criado_por=usuario.id,
        atualizado_por=usuario.id,
    )
    manutencao.custo_pecas = Decimal("0")
    manutencao.custo_total = manutencao.custo_mao_de_obra or Decimal("0")

    db.add(manutencao)
    db.flush()

    auditoria.registrar(
        db, acao="insert", usuario_id=usuario.id, empresa_id=empresa_id, tabela="manutencoes",
        registro_id=manutencao.id, dados_depois=auditoria.snapshot(manutencao), request=request,
    )
    db.commit()
    db.refresh(manutencao)

    return ManutencaoOut.model_validate(manutencao)


@router.get("/{manutencao_id}", response_model=ManutencaoOut)
def detalhar(
    manutencao_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("manutencoes.ver")),
    empresa_id: int = Depends(escopo_empresa),
) -> ManutencaoOut:
    return ManutencaoOut.model_validate(_obter(db, manutencao_id, empresa_id))


@router.patch("/{manutencao_id}", response_model=ManutencaoOut)
def atualizar(
    manutencao_id: int,
    corpo: ManutencaoUpdate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("manutencoes.editar")),
    empresa_id: int = Depends(escopo_empresa),
) -> ManutencaoOut:
    manutencao = _obter(db, manutencao_id, empresa_id)
    _garantir_edicao(usuario, manutencao)

    antes = auditoria.snapshot(manutencao)

    dados = corpo.model_dump(exclude_unset=True)

    # Trocar o prestador só vale se o novo também for da empresa.
    if dados.get("prestador_id") is not None:
        obter_do_escopo(
            db, Prestador, dados["prestador_id"], empresa_id,
            nao_encontrado="Prestador não encontrado.",
        )

    for campo, valor in dados.items():
        setattr(manutencao, campo, valor)

    manutencao.atualizado_por = usuario.id
    manutencao_service.recalcular_custos(db, manutencao)

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, empresa_id=empresa_id, tabela="manutencoes",
        registro_id=manutencao.id, dados_antes=antes,
        dados_depois=auditoria.snapshot(manutencao), request=request,
    )
    db.commit()
    db.refresh(manutencao)

    return ManutencaoOut.model_validate(manutencao)


@router.delete("/{manutencao_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(
    manutencao_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("manutencoes.deletar")),
    empresa_id: int = Depends(escopo_empresa),
) -> Response:
    manutencao = _obter(db, manutencao_id, empresa_id)
    antes = auditoria.snapshot(manutencao)

    db.delete(manutencao)
    auditoria.registrar(
        db, acao="delete", usuario_id=usuario.id, empresa_id=empresa_id, tabela="manutencoes",
        registro_id=manutencao_id, dados_antes=antes, request=request,
    )
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Peças da manutenção ----------------------------------------------------

@router.post("/{manutencao_id}/pecas", response_model=ManutencaoOut, status_code=status.HTTP_201_CREATED)
def adicionar_peca(
    manutencao_id: int,
    corpo: ManutencaoPecaCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("manutencoes.editar")),
    empresa_id: int = Depends(escopo_empresa),
) -> ManutencaoOut:
    manutencao = _obter(db, manutencao_id, empresa_id)
    _garantir_edicao(usuario, manutencao)

    peca = obter_do_escopo(
        db, Peca, corpo.peca_id, empresa_id, nao_encontrado="Peça não encontrada."
    )

    # Congela o custo unitário no momento do uso.
    custo = corpo.custo_unitario_na_data
    if custo is None:
        custo = peca.custo_unitario_atual
    if custo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A peça não tem custo unitário definido; informe custoUnitarioNaData.",
        )

    existente = db.get(ManutencaoPeca, (manutencao.id, peca.id))
    if existente is not None:
        existente.quantidade = corpo.quantidade
        existente.custo_unitario_na_data = custo
    else:
        db.add(
            ManutencaoPeca(
                manutencao_id=manutencao.id,
                peca_id=peca.id,
                quantidade=corpo.quantidade,
                custo_unitario_na_data=custo,
            )
        )

    db.flush()
    manutencao_service.recalcular_custos(db, manutencao)

    auditoria.registrar(
        db, acao="insert", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="manutencao_pecas",
        registro_id=manutencao.id,
        dados_depois={"pecaId": peca.id, "quantidade": str(corpo.quantidade)}, request=request,
    )
    db.commit()
    db.refresh(manutencao)

    return ManutencaoOut.model_validate(manutencao)


@router.delete("/{manutencao_id}/pecas/{peca_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_peca(
    manutencao_id: int,
    peca_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("manutencoes.editar")),
    empresa_id: int = Depends(escopo_empresa),
) -> Response:
    manutencao = _obter(db, manutencao_id, empresa_id)
    _garantir_edicao(usuario, manutencao)

    item = db.get(ManutencaoPeca, (manutencao_id, peca_id))
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Peça não vinculada a esta manutenção."
        )

    db.delete(item)
    db.flush()
    manutencao_service.recalcular_custos(db, manutencao)

    auditoria.registrar(
        db, acao="delete", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="manutencao_pecas",
        registro_id=manutencao_id, dados_antes={"pecaId": peca_id}, request=request,
    )
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Auxiliares -------------------------------------------------------------

def _obter(db: Session, manutencao_id: int, empresa_id: int) -> Manutencao:
    return obter_do_escopo(
        db, Manutencao, manutencao_id, empresa_id, nao_encontrado="Manutenção não encontrada."
    )


def _garantir_edicao(usuario: Usuario, manutencao: Manutencao) -> None:
    """Regra da spec §2.3: funcionario só edita manutenção que ele mesmo criou."""
    if not manutencao_service.pode_editar(usuario, manutencao):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode editar manutenções que você mesmo criou.",
        )
