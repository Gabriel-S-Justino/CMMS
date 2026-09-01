"""Gestão de empresas (tenants).

Quem cria e desativa empresa é o superadmin. O admin de uma empresa só alcança
a própria, e apenas para ver os dados e regenerar o código de convite.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import auditoria
from app.core.database import get_db
from app.core.permissions import requer, usuario_logado
from app.models.empresa import Empresa, gerar_codigo_convite
from app.models.usuario import Usuario
from app.schemas.empresa import (
    EmpresaCreate,
    EmpresaMinhaOut,
    EmpresaOut,
    EmpresaUpdate,
)

router = APIRouter(prefix="/empresas", tags=["empresas"])

# Quem pode ler/regenerar o código de convite da própria empresa.
PERMISSAO_CONVIDAR = "usuarios.aprovar"


@router.get("/minha", response_model=EmpresaMinhaOut)
def minha_empresa(
    usuario: Usuario = Depends(usuario_logado),
) -> EmpresaMinhaOut:
    """Empresa da sessão. O código de convite só sai para quem pode convidar."""
    pode_ver_codigo = usuario.eh_superadmin or usuario.tem_permissao(PERMISSAO_CONVIDAR)

    return EmpresaMinhaOut(
        id=usuario.empresa.id,
        nome=usuario.empresa.nome,
        codigo_convite=usuario.empresa.codigo_convite if pode_ver_codigo else None,
    )


@router.get("", response_model=list[EmpresaOut])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("empresas.gerenciar")),
) -> list[EmpresaOut]:
    return [
        EmpresaOut.model_validate(e) for e in db.scalars(select(Empresa).order_by(Empresa.nome))
    ]


@router.post("", response_model=EmpresaOut, status_code=status.HTTP_201_CREATED)
def criar(
    corpo: EmpresaCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("empresas.gerenciar")),
) -> EmpresaOut:
    empresa = Empresa(**corpo.model_dump(), codigo_convite=gerar_codigo_convite())
    db.add(empresa)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe uma empresa com este CNPJ."
        ) from None

    auditoria.registrar(
        db, acao="insert", usuario_id=usuario.id, empresa_id=empresa.id, tabela="empresas",
        registro_id=empresa.id, dados_depois=auditoria.snapshot(empresa), request=request,
    )
    db.commit()
    db.refresh(empresa)

    return EmpresaOut.model_validate(empresa)


@router.patch("/{empresa_id}", response_model=EmpresaOut)
def atualizar(
    empresa_id: int,
    corpo: EmpresaUpdate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("empresas.gerenciar")),
) -> EmpresaOut:
    empresa = _obter(db, empresa_id)
    antes = auditoria.snapshot(empresa)

    for campo, valor in corpo.model_dump(exclude_unset=True).items():
        setattr(empresa, campo, valor)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe uma empresa com este CNPJ."
        ) from None

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, empresa_id=empresa.id, tabela="empresas",
        registro_id=empresa.id, dados_antes=antes,
        dados_depois=auditoria.snapshot(empresa), request=request,
    )
    db.commit()
    db.refresh(empresa)

    return EmpresaOut.model_validate(empresa)


@router.post("/{empresa_id}/regenerar-convite", response_model=EmpresaOut)
def regenerar_convite(
    empresa_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_logado),
) -> EmpresaOut:
    """Invalida o código antigo e sorteia outro.

    Superadmin faz em qualquer empresa; o admin, só na dele. Fora disso é 404 —
    não confirmamos que a empresa existe para quem não é dela.
    """
    pode_na_propria = (
        usuario.empresa_id == empresa_id and usuario.tem_permissao(PERMISSAO_CONVIDAR)
    )

    if not usuario.eh_superadmin and not pode_na_propria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada."
        )

    empresa = _obter(db, empresa_id)
    antes = auditoria.snapshot(empresa)

    empresa.codigo_convite = gerar_codigo_convite()

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, empresa_id=empresa.id, tabela="empresas",
        registro_id=empresa.id, dados_antes=antes,
        dados_depois={"codigoConvite": "regenerado"}, request=request,
    )
    db.commit()
    db.refresh(empresa)

    return EmpresaOut.model_validate(empresa)


def _obter(db: Session, empresa_id: int) -> Empresa:
    empresa = db.get(Empresa, empresa_id)
    if empresa is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada."
        )
    return empresa
