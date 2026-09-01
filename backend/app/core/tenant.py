"""Escopo de empresa (multi-tenant).

Regra da casa: **nenhuma query de dado operacional roda sem filtro de empresa.**
Todo router de recurso (ativos, manutenções, planos, prestadores, peças, anexos)
declara `empresa_id: int = Depends(escopo_empresa)` e usa esse valor em toda
listagem, detalhe, update e delete.

Registro de outra empresa responde **404, nunca 403**: um 403 confirmaria que o
id existe, e isso já é vazamento de informação entre tenants.
"""

from typing import Any, TypeVar

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import usuario_logado
from app.models.usuario import Usuario

T = TypeVar("T")


def escopo_empresa(usuario: Usuario = Depends(usuario_logado)) -> int:
    """Empresa do usuário logado. É o filtro obrigatório de todo recurso operacional.

    O superadmin também cai aqui com a empresa "Plataforma", mas isso não é um
    buraco: ele não tem nenhuma permissão operacional, então `requer("ativos.ver")`
    e companhia já o barram antes.
    """
    return usuario.empresa_id


def escopo_empresa_admin(usuario: Usuario = Depends(usuario_logado)) -> int | None:
    """Escopo das telas administrativas (usuários, auditoria, empresas).

    Devolve `None` para o superadmin — que enxerga todas as empresas — e o
    `empresa_id` para qualquer outro. Quem consome precisa tratar o `None` como
    "sem filtro"; use apenas onde ver várias empresas é intencional.
    """
    return None if usuario.eh_superadmin else usuario.empresa_id


def obter_do_escopo(
    db: Session,
    modelo: type[T],
    registro_id: Any,
    empresa_id: int,
    *,
    nao_encontrado: str,
) -> T:
    """Carrega um registro exigindo que ele seja da empresa do escopo.

    Serve tanto para o `_obter` das rotas quanto para validar referência cruzada
    (o `ativoId` de uma manutenção, o `pecaId` de um item...). Fora do escopo o
    resultado é indistinguível de inexistente — que é o ponto.
    """
    registro = db.get(modelo, registro_id)

    if registro is None or getattr(registro, "empresa_id", None) != empresa_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=nao_encontrado)

    return registro
