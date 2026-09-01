"""Upload/download de anexos. Arquivos ficam fora do webroot, servidos por URL assinada."""

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core import auditoria
from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import requer, usuario_logado
from app.core.tenant import escopo_empresa, obter_do_escopo
from app.core.rate_limit import limiter
from app.core.security import criar_download_token, decodificar_token
from app.models.anexo import Anexo
from app.models.ativo import Ativo
from app.models.enums import TipoAnexo
from app.models.manutencao import Manutencao
from app.models.usuario import Usuario
from app.schemas.anexo import AnexoOut
from app.services import anexo_service

router = APIRouter(prefix="/anexos", tags=["anexos"])


def _com_url(anexo: Anexo) -> AnexoOut:
    saida = AnexoOut.model_validate(anexo)
    token = criar_download_token(anexo.id)
    saida.download_url = f"{settings.API_V1_PREFIX}/anexos/{anexo.id}/download?token={token}"
    return saida


@router.post("", response_model=AnexoOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def enviar(
    request: Request,
    arquivo: UploadFile = File(...),
    tipo: TipoAnexo = Form(...),
    manutencao_id: int | None = Form(default=None, alias="manutencaoId"),
    ativo_id: int | None = Form(default=None, alias="ativoId"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("anexos.enviar")),
    empresa_id: int = Depends(escopo_empresa),
) -> AnexoOut:
    if manutencao_id is None and ativo_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe manutencaoId ou ativoId.",
        )

    # O dono do anexo tem de estar na mesma empresa; fora dela, 404.
    if manutencao_id is not None:
        obter_do_escopo(
            db, Manutencao, manutencao_id, empresa_id,
            nao_encontrado="Manutenção não encontrada.",
        )

    if ativo_id is not None:
        obter_do_escopo(
            db, Ativo, ativo_id, empresa_id, nao_encontrado="Ativo não encontrado."
        )

    conteudo = await arquivo.read()

    try:
        # O MIME é detectado pelos bytes; o Content-Type do cliente é ignorado.
        nome_no_disco, mime = anexo_service.salvar(conteudo)
    except anexo_service.ArquivoGrandeDemais:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Arquivo maior que {settings.MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        ) from None
    except anexo_service.ArquivoInvalido as erro:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(erro)) from None

    anexo = Anexo(
        empresa_id=empresa_id,
        manutencao_id=manutencao_id,
        ativo_id=ativo_id,
        tipo=tipo,
        caminho_arquivo=nome_no_disco,
        nome_original=arquivo.filename,
        mime_type=mime,
        tamanho_bytes=len(conteudo),
        enviado_por=usuario.id,
    )
    db.add(anexo)
    db.flush()

    auditoria.registrar(
        db, acao="insert", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="anexos", registro_id=anexo.id,
        dados_depois=auditoria.snapshot(anexo), request=request,
    )
    db.commit()
    db.refresh(anexo)

    return _com_url(anexo)


@router.get("/{anexo_id}", response_model=AnexoOut)
def detalhar(
    anexo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_logado),
    empresa_id: int = Depends(escopo_empresa),
) -> AnexoOut:
    """Metadados + uma URL de download assinada e temporária."""
    return _com_url(_obter(db, anexo_id, empresa_id))


@router.get("/{anexo_id}/download")
def baixar(
    anexo_id: int,
    token: str | None = Query(default=None, description="Token da URL assinada."),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Rota pública, protegida pela assinatura do token (não pelo Bearer).

    `token` é opcional na assinatura só para que a ausência dele vire 403
    (negado) em vez de 422 (erro de validação), que vazaria a forma da rota.
    """
    payload = decodificar_token(token, tipo_esperado="download") if token else None

    if payload is None or payload.get("sub") != str(anexo_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Link inválido ou expirado."
        )

    # Sem escopo de empresa aqui de propósito: a rota é pública e a autorização
    # vem da assinatura do token, que já amarra o anexo_id exato.
    anexo = db.get(Anexo, anexo_id)
    if anexo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anexo não encontrado.")

    caminho = anexo_service.caminho_absoluto(anexo.caminho_arquivo)

    if not caminho.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo não encontrado no servidor."
        )

    return FileResponse(
        caminho,
        media_type=anexo.mime_type or "application/octet-stream",
        filename=anexo.nome_original or caminho.name,
    )


@router.delete("/{anexo_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(
    anexo_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requer("anexos.deletar")),
    empresa_id: int = Depends(escopo_empresa),
) -> Response:
    anexo = _obter(db, anexo_id, empresa_id)
    antes = auditoria.snapshot(anexo)
    nome_no_disco = anexo.caminho_arquivo

    db.delete(anexo)
    auditoria.registrar(
        db, acao="delete", usuario_id=usuario.id, empresa_id=empresa_id,
        tabela="anexos", registro_id=anexo_id,
        dados_antes=antes, request=request,
    )
    db.commit()

    # Só apaga do disco depois do commit: se a transação falhar, o arquivo continua lá.
    anexo_service.remover(nome_no_disco)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _obter(db: Session, anexo_id: int, empresa_id: int) -> Anexo:
    return obter_do_escopo(
        db, Anexo, anexo_id, empresa_id, nao_encontrado="Anexo não encontrado."
    )
