"""Upload de anexos: valida o MIME real pelos bytes, não pelo que o cliente diz."""

import uuid
from pathlib import Path

from app.core.config import settings

# Assinatura (magic bytes) -> mime aceito. O Content-Type enviado pelo cliente
# é ignorado de propósito: só o conteúdo real decide.
ASSINATURAS: list[tuple[bytes, str]] = [
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"GIF87a", "image/gif"),
    (b"GIF89a", "image/gif"),
    (b"%PDF-", "application/pdf"),
]

EXTENSAO_POR_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "image/webp": ".webp",
}


class ArquivoInvalido(Exception):
    pass


class ArquivoGrandeDemais(Exception):
    pass


def detectar_mime(conteudo: bytes) -> str:
    for assinatura, mime in ASSINATURAS:
        if conteudo.startswith(assinatura):
            return mime

    # WebP: "RIFF" .... "WEBP"
    if conteudo[:4] == b"RIFF" and conteudo[8:12] == b"WEBP":
        return "image/webp"

    raise ArquivoInvalido("Tipo de arquivo não permitido. Aceitos: JPEG, PNG, GIF, WebP e PDF.")


def diretorio_uploads() -> Path:
    caminho = Path(settings.UPLOAD_DIR)
    caminho.mkdir(parents=True, exist_ok=True)
    return caminho


def salvar(conteudo: bytes) -> tuple[str, str]:
    """Grava o arquivo com nome UUID e devolve (nome_no_disco, mime detectado)."""
    if len(conteudo) > settings.MAX_UPLOAD_BYTES:
        raise ArquivoGrandeDemais

    if not conteudo:
        raise ArquivoInvalido("Arquivo vazio.")

    mime = detectar_mime(conteudo)
    nome = f"{uuid.uuid4().hex}{EXTENSAO_POR_MIME[mime]}"

    (diretorio_uploads() / nome).write_bytes(conteudo)
    return nome, mime


def caminho_absoluto(nome_arquivo: str) -> Path:
    """Resolve o caminho impedindo qualquer path traversal no nome gravado."""
    base = diretorio_uploads().resolve()
    alvo = (base / Path(nome_arquivo).name).resolve()

    if not alvo.is_relative_to(base):
        raise ArquivoInvalido("Caminho de arquivo inválido.")

    return alvo


def remover(nome_arquivo: str) -> None:
    caminho_absoluto(nome_arquivo).unlink(missing_ok=True)
