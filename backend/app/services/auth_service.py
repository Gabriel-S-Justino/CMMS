"""Regra de negócio de autenticação. Sem FastAPI aqui."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    criar_access_token,
    gerar_token_opaco,
    hash_senha,
    hash_token_opaco,
    precisa_rehash,
    verificar_senha,
)
from app.models.empresa import Empresa
from app.models.refresh_token import RefreshToken
from app.models.token_recuperacao import TokenRecuperacaoSenha
from app.models.usuario import Usuario

# --- Bloqueio de conta ------------------------------------------------------

MAX_TENTATIVAS_FALHAS = 5
BLOQUEIO_MINUTOS = 15

# Hash descartável, calculado uma vez por processo. Serve só para gastar o mesmo
# tempo de argon2 quando o username não existe — sem isso, a diferença de tempo
# de resposta entrega quais usuários estão cadastrados.
_HASH_FANTASMA = hash_senha(gerar_token_opaco())


class CredenciaisInvalidas(Exception):
    pass


class CadastroPendente(Exception):
    pass


class ContaBloqueada(Exception):
    """Excesso de senhas erradas. Vira HTTP 423 no router."""

    def __init__(self, bloqueado_ate: datetime) -> None:
        super().__init__(bloqueado_ate)
        self.bloqueado_ate = bloqueado_ate


class UsuarioJaExiste(Exception):
    def __init__(self, campo: str) -> None:
        super().__init__(campo)
        self.campo = campo


class ConviteInvalido(Exception):
    """Código de convite inexistente ou de empresa desativada."""


def buscar_por_username(db: Session, username: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(Usuario.username == username))


def buscar_por_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(Usuario.email == email))


def buscar_empresa_por_convite(db: Session, codigo: str) -> Empresa | None:
    """Empresa ATIVA dona do código. Comparação sem espaços e sem caixa: o
    usuário digita o código à mão."""
    normalizado = codigo.strip().upper()
    if not normalizado:
        return None

    return db.scalar(
        select(Empresa).where(
            Empresa.codigo_convite == normalizado, Empresa.ativo.is_(True)
        )
    )


# --- Login / tokens ---------------------------------------------------------

def autenticar(db: Session, username: str, senha: str) -> Usuario:
    """Valida usuário e senha.

    Levanta CredenciaisInvalidas, CadastroPendente ou ContaBloqueada.
    Quem chama precisa commitar mesmo em caso de erro: o contador de tentativas
    falhas é gravado no próprio objeto do usuário.
    """
    usuario = buscar_por_username(db, username)
    agora = datetime.now(UTC)

    if usuario is None:
        # Gasta o mesmo tempo de um argon2 real para não vazar quem existe.
        verificar_senha(senha, _HASH_FANTASMA)
        raise CredenciaisInvalidas

    if usuario.bloqueado_ate is not None:
        if usuario.bloqueado_ate > agora:
            raise ContaBloqueada(usuario.bloqueado_ate)
        # Bloqueio venceu: o usuário recomeça com a cota cheia de tentativas.
        usuario.bloqueado_ate = None
        usuario.tentativas_falhas = 0

    if not verificar_senha(senha, usuario.senha_hash):
        usuario.tentativas_falhas += 1
        if usuario.tentativas_falhas >= MAX_TENTATIVAS_FALHAS:
            usuario.bloqueado_ate = agora + timedelta(minutes=BLOQUEIO_MINUTOS)
        raise CredenciaisInvalidas

    if not usuario.ativo:
        raise CadastroPendente

    # Parâmetros do argon2 mudaram? Regrava o hash de forma transparente.
    if precisa_rehash(usuario.senha_hash):
        usuario.senha_hash = hash_senha(senha)

    usuario.tentativas_falhas = 0
    usuario.bloqueado_ate = None
    usuario.ultimo_login = agora
    return usuario


def emitir_refresh_token(db: Session, usuario: Usuario) -> str:
    """Cria um refresh token novo. O banco guarda só o hash."""
    token = gerar_token_opaco()
    db.add(
        RefreshToken(
            usuario_id=usuario.id,
            token_hash=hash_token_opaco(token),
            expira_em=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    return token


def emitir_par_de_tokens(db: Session, usuario: Usuario) -> tuple[str, str]:
    return criar_access_token(usuario.id), emitir_refresh_token(db, usuario)


def _buscar_refresh_valido(db: Session, token: str) -> RefreshToken | None:
    registro = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_token_opaco(token))
    )

    if registro is None or registro.revogado:
        return None

    if registro.expira_em <= datetime.now(UTC):
        return None

    return registro


def rotacionar_refresh_token(db: Session, token: str) -> tuple[Usuario, str, str]:
    """Consome o refresh token, revoga e devolve um par novo (rotação a cada uso)."""
    registro = _buscar_refresh_valido(db, token)
    if registro is None:
        raise CredenciaisInvalidas

    usuario = db.get(Usuario, registro.usuario_id)
    if usuario is None or not usuario.ativo:
        raise CredenciaisInvalidas

    registro.revogado = True
    access, refresh = emitir_par_de_tokens(db, usuario)
    return usuario, access, refresh


def revogar_refresh_token(db: Session, token: str) -> None:
    """Logout: idempotente de propósito — token inválido não vira erro."""
    registro = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_token_opaco(token))
    )
    if registro is not None:
        registro.revogado = True


# --- Cadastro público -------------------------------------------------------

def registrar_usuario(
    db: Session,
    *,
    username: str,
    cargo: str,
    codigo_convite: str,
    funcao: str,
    email: str,
    senha: str,
) -> Usuario:
    """Cria o usuário INATIVO na empresa do convite.

    Um admin DAQUELA empresa aprova e define o perfil depois. O código de
    convite é a única coisa que amarra o cadastro a um tenant — não existe mais
    campo de empresa digitado à mão.
    """
    empresa = buscar_empresa_por_convite(db, codigo_convite)
    if empresa is None:
        raise ConviteInvalido

    if buscar_por_username(db, username) is not None:
        raise UsuarioJaExiste("username")

    if buscar_por_email(db, email) is not None:
        raise UsuarioJaExiste("email")

    usuario = Usuario(
        username=username,
        email=email,
        senha_hash=hash_senha(senha),
        cargo=cargo,
        empresa_id=empresa.id,
        funcao=funcao,
        perfil_id=None,
        ativo=False,
    )
    db.add(usuario)
    db.flush()
    return usuario


# --- Recuperação de senha ---------------------------------------------------

def criar_token_recuperacao(db: Session, usuario: Usuario) -> str:
    token = gerar_token_opaco()
    db.add(
        TokenRecuperacaoSenha(
            usuario_id=usuario.id,
            token_hash=hash_token_opaco(token),
            expira_em=datetime.now(UTC) + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES),
        )
    )
    return token


def redefinir_senha(db: Session, token: str, nova_senha: str) -> Usuario:
    registro = db.scalar(
        select(TokenRecuperacaoSenha).where(
            TokenRecuperacaoSenha.token_hash == hash_token_opaco(token)
        )
    )

    if registro is None or registro.usado or registro.expira_em <= datetime.now(UTC):
        raise CredenciaisInvalidas

    usuario = db.get(Usuario, registro.usuario_id)
    if usuario is None:
        raise CredenciaisInvalidas

    usuario.senha_hash = hash_senha(nova_senha)
    registro.usado = True

    # Quem provou ser o dono do e-mail sai do bloqueio por tentativas.
    usuario.tentativas_falhas = 0
    usuario.bloqueado_ate = None

    # Trocar a senha derruba todas as sessões abertas.
    for refresh in db.scalars(
        select(RefreshToken).where(
            RefreshToken.usuario_id == usuario.id, RefreshToken.revogado.is_(False)
        )
    ):
        refresh.revogado = True

    return usuario
