"""Aprovação de cadastros e gestão de perfis/permissões (spec §4)."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import auditoria
from app.core.database import get_db
from app.core.permissions import requer
from app.models.perfil import Perfil
from app.models.permissao import Permissao
from app.models.usuario import Usuario
from app.schemas.usuario import (
    AprovarUsuarioRequest,
    PerfilCreate,
    PerfilOut,
    PerfilPermissoesRequest,
    PerfilUpdate,
    PermissaoOut,
    UsuarioOut,
    UsuarioUpdate,
)
from app.services import usuario_service

router = APIRouter(tags=["usuarios"])


# --- Usuários ---------------------------------------------------------------

@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(
    pendentes: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("usuarios.ver")),
) -> list[UsuarioOut]:
    return [
        UsuarioOut(**usuario_service.para_saida(u))
        for u in usuario_service.listar(db, pendentes=pendentes)
    ]


@router.patch("/usuarios/{usuario_id}/aprovar", response_model=UsuarioOut)
def aprovar_usuario(
    usuario_id: int,
    corpo: AprovarUsuarioRequest,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("usuarios.aprovar")),
) -> UsuarioOut:
    alvo = _obter_usuario(db, usuario_id)
    antes = auditoria.snapshot(alvo)

    try:
        usuario_service.aprovar(db, alvo, corpo.perfil_id)
    except ValueError as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro)) from None

    auditoria.registrar(
        db, acao="aprovacao", usuario_id=usuario.id, tabela="usuarios", registro_id=alvo.id,
        dados_antes=antes, dados_depois=auditoria.snapshot(alvo), request=request,
    )
    db.commit()
    db.refresh(alvo)

    return UsuarioOut(**usuario_service.para_saida(alvo))


@router.patch("/usuarios/{usuario_id}", response_model=UsuarioOut)
def atualizar_usuario(
    usuario_id: int,
    corpo: UsuarioUpdate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("usuarios.gerenciar")),
) -> UsuarioOut:
    alvo = _obter_usuario(db, usuario_id)
    antes = auditoria.snapshot(alvo)

    for campo, valor in corpo.model_dump(exclude_unset=True).items():
        setattr(alvo, campo, valor)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="E-mail já está em uso."
        ) from None

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, tabela="usuarios", registro_id=alvo.id,
        dados_antes=antes, dados_depois=auditoria.snapshot(alvo), request=request,
    )
    db.commit()
    db.refresh(alvo)

    return UsuarioOut(**usuario_service.para_saida(alvo))


# --- Perfis e permissões ----------------------------------------------------

@router.get("/perfis", response_model=list[PerfilOut])
def listar_perfis(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("perfis.gerenciar")),
) -> list[PerfilOut]:
    return [_perfil_out(p) for p in db.scalars(select(Perfil).order_by(Perfil.id))]


@router.post("/perfis", response_model=PerfilOut, status_code=status.HTTP_201_CREATED)
def criar_perfil(
    corpo: PerfilCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("perfis.gerenciar")),
) -> PerfilOut:
    perfil = Perfil(nome=corpo.nome, descricao=corpo.descricao)
    db.add(perfil)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe um perfil com este nome."
        ) from None

    auditoria.registrar(
        db, acao="insert", usuario_id=usuario.id, tabela="perfis", registro_id=perfil.id,
        dados_depois=auditoria.snapshot(perfil), request=request,
    )
    db.commit()
    db.refresh(perfil)

    return _perfil_out(perfil)


@router.patch("/perfis/{perfil_id}", response_model=PerfilOut)
def atualizar_perfil(
    perfil_id: int,
    corpo: PerfilUpdate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("perfis.gerenciar")),
) -> PerfilOut:
    perfil = _obter_perfil(db, perfil_id)
    antes = auditoria.snapshot(perfil)

    for campo, valor in corpo.model_dump(exclude_unset=True).items():
        setattr(perfil, campo, valor)

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, tabela="perfis", registro_id=perfil.id,
        dados_antes=antes, dados_depois=auditoria.snapshot(perfil), request=request,
    )
    db.commit()
    db.refresh(perfil)

    return _perfil_out(perfil)


@router.get("/perfis/{perfil_id}/permissoes", response_model=list[PermissaoOut])
def listar_permissoes_do_perfil(
    perfil_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("perfis.gerenciar")),
) -> list[PermissaoOut]:
    perfil = _obter_perfil(db, perfil_id)
    return [PermissaoOut.model_validate(p) for p in perfil.permissoes]


@router.post("/perfis/{perfil_id}/permissoes", response_model=PerfilOut)
def definir_permissoes_do_perfil(
    perfil_id: int,
    corpo: PerfilPermissoesRequest,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("perfis.gerenciar")),
) -> PerfilOut:
    """Substitui o conjunto inteiro de permissões do perfil."""
    perfil = _obter_perfil(db, perfil_id)
    antes = {"permissoes": sorted(p.codigo for p in perfil.permissoes)}

    encontradas = list(
        db.scalars(select(Permissao).where(Permissao.codigo.in_(corpo.permissoes)))
    )
    codigos_encontrados = {p.codigo for p in encontradas}
    desconhecidas = sorted(set(corpo.permissoes) - codigos_encontrados)

    if desconhecidas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permissões inexistentes: {', '.join(desconhecidas)}.",
        )

    perfil.permissoes = encontradas

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, tabela="perfil_permissoes",
        registro_id=perfil.id, dados_antes=antes,
        dados_depois={"permissoes": sorted(codigos_encontrados)}, request=request,
    )
    db.commit()
    db.refresh(perfil)

    return _perfil_out(perfil)


# --- Auxiliares -------------------------------------------------------------

def _obter_usuario(db: Session, usuario_id: int) -> Usuario:
    alvo = db.get(Usuario, usuario_id)
    if alvo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    return alvo


def _obter_perfil(db: Session, perfil_id: int) -> Perfil:
    perfil = db.get(Perfil, perfil_id)
    if perfil is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil não encontrado.")
    return perfil


def _perfil_out(perfil: Perfil) -> PerfilOut:
    return PerfilOut(
        id=perfil.id,
        nome=perfil.nome,
        descricao=perfil.descricao,
        permissoes=sorted(p.codigo for p in perfil.permissoes),
    )
