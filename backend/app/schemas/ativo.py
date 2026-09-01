from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import Field, field_validator

from app.models.enums import CategoriaAtivo, StatusAtivo
from app.schemas.common import CamelModel


class AtivoOut(CamelModel):
    """Espelha EXATAMENTE o `type Asset` de frontend/src/types/assets.ts.

    `id` sai como string porque no front `Asset.id` é `string`.
    `lastMaintenanceDate` é calculado (MAX de manutencoes.data_servico) e vem
    nulo quando o ativo ainda não tem manutenção registrada.
    """

    id: str
    name: str
    category: CategoriaAtivo
    type: str | None = None
    location: str | None = None
    status: StatusAtivo
    last_maintenance_date: date | None = None
    is_maintenance_overdue: bool = False

    @field_validator("id", mode="before")
    @classmethod
    def _id_para_string(cls, valor: Any) -> str:
        return str(valor)


class AtivoBase(CamelModel):
    """Campos do formulário de `view/cadAtivos/cadAtivos.tsx`, em camelCase."""

    nome: str = Field(min_length=1, max_length=150)
    categoria: CategoriaAtivo
    tipo: str | None = Field(default=None, max_length=80)
    codigo: str | None = Field(default=None, max_length=50)
    patrimonio: str | None = Field(default=None, max_length=50)

    fabricante: str | None = Field(default=None, max_length=100)
    modelo: str | None = Field(default=None, max_length=100)
    ano: int | None = Field(default=None, ge=1900, le=2100)
    numero_serie: str | None = Field(default=None, max_length=100)

    localizacao: str | None = Field(default=None, max_length=150)
    responsavel: str | None = Field(default=None, max_length=150)
    status: StatusAtivo = StatusAtivo.operational
    horimetro_atual: Decimal | None = None
    quilometragem: Decimal | None = None

    data_aquisicao: date | None = None
    fornecedor: str | None = Field(default=None, max_length=150)
    valor_aquisicao: Decimal | None = None
    numero_nota_fiscal: str | None = Field(default=None, max_length=60)
    garantia_ate: date | None = None
    observacoes: str | None = None

    # --- Específicos por categoria ---
    # Declarados explicitamente (e não via extra="allow") para o Pydantic
    # continuar validando tudo. O router move estes campos para dentro de
    # `especificacoes` (JSONB) antes de gravar. Podem vir soltos no corpo,
    # como o formulário do cadAtivos.tsx monta, ou já dentro de especificacoes.
    placa: str | None = Field(default=None, max_length=10)
    renavam: str | None = Field(default=None, max_length=20)
    chassi: str | None = Field(default=None, max_length=30)
    combustivel: str | None = Field(default=None, max_length=30)
    potencia: str | None = Field(default=None, max_length=30)
    tensao: str | None = Field(default=None, max_length=30)
    capacidade: str | None = Field(default=None, max_length=30)

    especificacoes: dict[str, Any] = Field(default_factory=dict)


class AtivoCreate(AtivoBase):
    pass


class AtivoUpdate(CamelModel):
    nome: str | None = Field(default=None, max_length=150)
    categoria: CategoriaAtivo | None = None
    tipo: str | None = Field(default=None, max_length=80)
    codigo: str | None = Field(default=None, max_length=50)
    patrimonio: str | None = Field(default=None, max_length=50)
    fabricante: str | None = Field(default=None, max_length=100)
    modelo: str | None = Field(default=None, max_length=100)
    ano: int | None = Field(default=None, ge=1900, le=2100)
    numero_serie: str | None = Field(default=None, max_length=100)
    localizacao: str | None = Field(default=None, max_length=150)
    responsavel: str | None = Field(default=None, max_length=150)
    status: StatusAtivo | None = None
    horimetro_atual: Decimal | None = None
    quilometragem: Decimal | None = None
    data_aquisicao: date | None = None
    fornecedor: str | None = Field(default=None, max_length=150)
    valor_aquisicao: Decimal | None = None
    numero_nota_fiscal: str | None = Field(default=None, max_length=60)
    garantia_ate: date | None = None
    observacoes: str | None = None
    placa: str | None = Field(default=None, max_length=10)
    renavam: str | None = Field(default=None, max_length=20)
    chassi: str | None = Field(default=None, max_length=30)
    combustivel: str | None = Field(default=None, max_length=30)
    potencia: str | None = Field(default=None, max_length=30)
    tensao: str | None = Field(default=None, max_length=30)
    capacidade: str | None = Field(default=None, max_length=30)
    especificacoes: dict[str, Any] | None = None


class ManutencaoResumo(CamelModel):
    id: int
    tipo: str
    status: str
    descricao: str | None = None
    data_servico: date | None = None
    custo_total: Decimal


class PlanoResumo(CamelModel):
    id: int
    descricao: str
    intervalo_dias: int | None = None
    intervalo_horas: int | None = None
    ultima_execucao: date | None = None
    proxima_prevista: date | None = None
    ativo: bool


class AtivoDetalheOut(AtivoBase):
    """Detalhe completo: os campos do ativo + últimas manutenções + planos.

    Os campos específicos por categoria saem só dentro de `especificacoes`,
    que é como eles vivem no banco.
    """

    placa: str | None = Field(default=None, exclude=True)
    renavam: str | None = Field(default=None, exclude=True)
    chassi: str | None = Field(default=None, exclude=True)
    combustivel: str | None = Field(default=None, exclude=True)
    potencia: str | None = Field(default=None, exclude=True)
    tensao: str | None = Field(default=None, exclude=True)
    capacidade: str | None = Field(default=None, exclude=True)

    id: int
    criado_por: int | None = None
    atualizado_por: int | None = None
    criado_em: datetime
    atualizado_em: datetime | None = None

    ultima_manutencao: date | None = None
    manutencao_atrasada: bool = False
    manutencoes: list[ManutencaoResumo] = []
    planos: list[PlanoResumo] = []
