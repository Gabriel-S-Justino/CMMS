"""Enums do domínio.

Os valores string são EXATAMENTE os que o frontend usa em
`frontend/src/types/assets.ts` e `view/cadAtivos/cadAtivos.tsx`.
Nada de traduzir aqui: o backend fala a língua do front.
"""

import enum


class CategoriaAtivo(str, enum.Enum):
    vehicle = "vehicle"
    industrialMachine = "industrialMachine"
    equipment = "equipment"
    electrical = "electrical"
    infrastructure = "infrastructure"
    other = "other"


class StatusAtivo(str, enum.Enum):
    operational = "operational"
    maintenance = "maintenance"
    stopped = "stopped"
    alert = "alert"


class TipoManutencao(str, enum.Enum):
    preventiva = "preventiva"
    corretiva = "corretiva"
    preditiva = "preditiva"


class StatusManutencao(str, enum.Enum):
    aberta = "aberta"
    em_andamento = "em_andamento"
    concluida = "concluida"
    cancelada = "cancelada"


class TipoAnexo(str, enum.Enum):
    foto = "foto"
    nota_fiscal = "nota_fiscal"
    laudo = "laudo"
    orcamento = "orcamento"
    outro = "outro"


# Nomes dos tipos ENUM no PostgreSQL (usados no model e na migration).
NOME_ENUM_CATEGORIA = "categoria_ativo"
NOME_ENUM_STATUS_ATIVO = "status_ativo"
NOME_ENUM_TIPO_MANUTENCAO = "tipo_manutencao"
NOME_ENUM_STATUS_MANUTENCAO = "status_manutencao"
NOME_ENUM_TIPO_ANEXO = "tipo_anexo"


def valores(enum_cls: type[enum.Enum]) -> list[str]:
    """Usado no `values_callable` do sa.Enum: grava o VALOR, não o nome do membro."""
    return [membro.value for membro in enum_cls]
