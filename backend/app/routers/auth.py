"""Rotas de `login.tsx`, `cadUser.tsx` e `recuperarSenha.tsx` (spec §4)."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core import auditoria
from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import usuario_logado
from app.core.rate_limit import limiter
from app.models.usuario import Usuario
from app.schemas.auth import (
    LoginRequest,
    RecuperarSenhaRequest,
    RedefinirSenhaRequest,
    RefreshRequest,
    RefreshResponse,
    RegistroRequest,
    TokenResponse,
    UsuarioSessao,
)
from app.schemas.common import MensagemResponse
from app.schemas.empresa import EmpresaResumo
from app.schemas.usuario import UsuarioOut
from app.services import auth_service, usuario_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _sessao(usuario: Usuario) -> UsuarioSessao:
    return UsuarioSessao(
        id=usuario.id,
        username=usuario.username,
        perfil=usuario.perfil.nome if usuario.perfil else None,
        permissoes=usuario.permissoes,
        empresa=EmpresaResumo(id=usuario.empresa.id, nome=usuario.empresa.nome),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, corpo: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        usuario = auth_service.autenticar(db, corpo.username, corpo.senha)
    except auth_service.CadastroPendente:
        auditoria.registrar(
            db, acao="login_falho", tabela="usuarios", request=request,
            empresa_id=_empresa_do_username(db, corpo.username),
            dados_depois={"username": corpo.username, "motivo": "aguardando aprovacao"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cadastro aguardando aprovação"
        ) from None
    except auth_service.ContaBloqueada as bloqueio:
        auditoria.registrar(
            db, acao="login_falho", tabela="usuarios", request=request,
            empresa_id=_empresa_do_username(db, corpo.username),
            dados_depois={"username": corpo.username, "motivo": "conta bloqueada"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=(
                "Conta temporariamente bloqueada por excesso de tentativas. "
                f"Tente novamente após {bloqueio.bloqueado_ate:%H:%M}."
            ),
        ) from None
    except auth_service.CredenciaisInvalidas:
        # O commit aqui não é opcional: é ele que grava o contador de tentativas.
        auditoria.registrar(
            db, acao="login_falho", tabela="usuarios", request=request,
            empresa_id=_empresa_do_username(db, corpo.username),
            dados_depois={"username": corpo.username, "motivo": "credenciais invalidas"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário ou senha inválidos."
        ) from None

    access, refresh = auth_service.emitir_par_de_tokens(db, usuario)
    auditoria.registrar(
        db, acao="login", usuario_id=usuario.id, empresa_id=usuario.empresa_id,
        tabela="usuarios", registro_id=usuario.id, request=request,
    )
    db.commit()

    return TokenResponse(access_token=access, refresh_token=refresh, usuario=_sessao(usuario))


@router.post("/refresh", response_model=RefreshResponse)
@limiter.limit("30/minute")
def refresh(
    request: Request, corpo: RefreshRequest, db: Session = Depends(get_db)
) -> RefreshResponse:
    try:
        _, access, novo_refresh = auth_service.rotacionar_refresh_token(db, corpo.refresh_token)
    except auth_service.CredenciaisInvalidas:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido ou expirado."
        ) from None

    db.commit()
    return RefreshResponse(access_token=access, refresh_token=novo_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    corpo: RefreshRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_logado),
) -> Response:
    auth_service.revogar_refresh_token(db, corpo.refresh_token)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/registrar", response_model=MensagemResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def registrar(
    request: Request, corpo: RegistroRequest, db: Session = Depends(get_db)
) -> MensagemResponse:
    try:
        usuario = auth_service.registrar_usuario(
            db,
            username=corpo.username,
            cargo=corpo.cargo,
            codigo_convite=corpo.codigo_convite,
            funcao=corpo.funcao,
            email=corpo.email,
            senha=corpo.senha,
        )
    except auth_service.ConviteInvalido:
        # Mensagem genérica de propósito: não dizemos se o código existe mas a
        # empresa está desativada, nem confirmamos códigos por tentativa e erro.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código da empresa inválido. Peça o código ao administrador da sua empresa.",
        ) from None
    except auth_service.UsuarioJaExiste as erro:
        rotulo = "nome de usuário" if erro.campo == "username" else "e-mail"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=f"Este {rotulo} já está em uso."
        ) from None

    auditoria.registrar(
        db, acao="insert", empresa_id=usuario.empresa_id, tabela="usuarios",
        registro_id=usuario.id, dados_depois=auditoria.snapshot(usuario), request=request,
    )
    db.commit()

    return MensagemResponse(mensagem="Solicitação enviada, aguarde aprovação")


@router.post("/recuperar-senha", response_model=MensagemResponse)
@limiter.limit("5/minute")
def recuperar_senha(
    request: Request, corpo: RecuperarSenhaRequest, db: Session = Depends(get_db)
) -> MensagemResponse:
    """Responde 200 sempre: não revela se o e-mail existe."""
    usuario = auth_service.buscar_por_email(db, corpo.email)

    if usuario is not None:
        token = auth_service.criar_token_recuperacao(db, usuario)
        # TODO: enviar o token por e-mail. Em DEBUG ele vai para o log do servidor.
        if settings.DEBUG:
            print(f"[recuperar-senha] token de {usuario.username}: {token}", flush=True)
        db.commit()

    return MensagemResponse(
        mensagem="Se o e-mail estiver cadastrado, enviamos um link de recuperação."
    )


@router.post("/redefinir-senha", response_model=MensagemResponse)
@limiter.limit("5/minute")
def redefinir_senha(
    request: Request, corpo: RedefinirSenhaRequest, db: Session = Depends(get_db)
) -> MensagemResponse:
    try:
        usuario = auth_service.redefinir_senha(db, corpo.token, corpo.nova_senha)
    except auth_service.CredenciaisInvalidas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido ou expirado."
        ) from None

    auditoria.registrar(
        db, acao="update", usuario_id=usuario.id, empresa_id=usuario.empresa_id,
        tabela="usuarios", registro_id=usuario.id,
        dados_depois={"senha": "redefinida"}, request=request,
    )
    db.commit()

    return MensagemResponse(mensagem="Senha redefinida com sucesso.")


@router.get("/me", response_model=UsuarioOut)
def me(usuario: Usuario = Depends(usuario_logado)) -> UsuarioOut:
    return UsuarioOut(**usuario_service.para_saida(usuario))


def _empresa_do_username(db: Session, username: str) -> int | None:
    """Empresa a associar ao log de um login falho. Nulo se o username não existe."""
    alvo = auth_service.buscar_por_username(db, username)
    return alvo.empresa_id if alvo is not None else None
