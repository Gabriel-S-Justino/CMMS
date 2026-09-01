"""Helper único de gravação em `logs_auditoria`.

Registra todo insert/update/delete e também login (ok e falho).
Nunca faz commit: quem chama controla a transação.
"""

from decimal import Decimal
from datetime import date, datetime
from enum import Enum
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models.log_auditoria import LogAuditoria

# Campos que jamais podem cair no log. `codigo_convite` entra na lista porque
# quem lê o log passaria a conseguir cadastrar-se na empresa.
CAMPOS_SENSIVEIS = {
    "senha",
    "senha_hash",
    "token",
    "token_hash",
    "nova_senha",
    "codigo_convite",
}


def _serializavel(valor: Any) -> Any:
    if isinstance(valor, Enum):
        return valor.value
    if isinstance(valor, (datetime, date)):
        return valor.isoformat()
    if isinstance(valor, Decimal):
        return str(valor)
    return valor


def snapshot(instancia: Base | None) -> dict[str, Any] | None:
    """Congela as colunas de um model num dict pronto pra virar JSONB."""
    if instancia is None:
        return None

    return {
        coluna.key: _serializavel(getattr(instancia, coluna.key))
        for coluna in instancia.__table__.columns
        if coluna.key not in CAMPOS_SENSIVEIS
    }


def ip_do_request(request: Request | None) -> str | None:
    """IP do cliente conforme o servidor o enxerga.

    Não lemos X-Forwarded-For à mão: qualquer cliente pode forjar esse
    cabeçalho e envenenar a auditoria. Quem resolve isso é o uvicorn, que roda
    com --proxy-headers e só confia nos proxies listados em FORWARDED_ALLOW_IPS
    (vazio por padrão) antes de reescrever request.client.
    """
    if request is None:
        return None
    return request.client.host if request.client else None


def registrar(
    db: Session,
    *,
    acao: str,
    usuario_id: int | None = None,
    empresa_id: int | None = None,
    tabela: str | None = None,
    registro_id: int | None = None,
    dados_antes: dict[str, Any] | None = None,
    dados_depois: dict[str, Any] | None = None,
    request: Request | None = None,
) -> None:
    """`empresa_id` fica nulo só quando não há tenant conhecido — por exemplo,
    um login falho de username que não existe."""
    db.add(
        LogAuditoria(
            empresa_id=empresa_id,
            usuario_id=usuario_id,
            acao=acao,
            tabela=tabela,
            registro_id=registro_id,
            dados_antes=dados_antes,
            dados_depois=dados_depois,
            ip=ip_do_request(request),
        )
    )
