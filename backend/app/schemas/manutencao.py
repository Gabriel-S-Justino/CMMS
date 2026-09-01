from datetime import date, datetime
from decimal import Decimal

from pydantic import Field

from app.models.enums import StatusManutencao, TipoManutencao
from app.schemas.common import CamelModel


class ManutencaoPecaOut(CamelModel):
    peca_id: int
    quantidade: Decimal
    custo_unitario_na_data: Decimal


class ManutencaoOut(CamelModel):
    id: int
    ativo_id: int
    prestador_id: int | None = None
    tipo: TipoManutencao
    status: StatusManutencao
    descricao: str | None = None
    data_abertura: datetime
    data_servico: date | None = None
    data_conclusao: date | None = None
    horimetro_no_servico: Decimal | None = None
    custo_mao_de_obra: Decimal
    custo_pecas: Decimal
    custo_total: Decimal
    criado_por: int | None = None
    criado_em: datetime
    pecas: list[ManutencaoPecaOut] = []


class ManutencaoCreate(CamelModel):
    ativo_id: int
    prestador_id: int | None = None
    tipo: TipoManutencao
    status: StatusManutencao = StatusManutencao.aberta
    descricao: str | None = None
    data_servico: date | None = None
    data_conclusao: date | None = None
    horimetro_no_servico: Decimal | None = None
    custo_mao_de_obra: Decimal = Decimal("0")


class ManutencaoUpdate(CamelModel):
    prestador_id: int | None = None
    tipo: TipoManutencao | None = None
    status: StatusManutencao | None = None
    descricao: str | None = None
    data_servico: date | None = None
    data_conclusao: date | None = None
    horimetro_no_servico: Decimal | None = None
    custo_mao_de_obra: Decimal | None = None


class ManutencaoPecaCreate(CamelModel):
    peca_id: int
    quantidade: Decimal = Field(gt=0)
    # Se não vier, congela o custo_unitario_atual da peça no momento do uso.
    custo_unitario_na_data: Decimal | None = None
