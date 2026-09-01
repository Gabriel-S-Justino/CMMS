from datetime import date, datetime

from pydantic import Field, model_validator

from app.schemas.common import CamelModel


class PlanoOut(CamelModel):
    id: int
    ativo_id: int
    descricao: str
    intervalo_dias: int | None = None
    intervalo_horas: int | None = None
    ultima_execucao: date | None = None
    proxima_prevista: date | None = None
    ativo: bool
    criado_em: datetime


class PlanoCreate(CamelModel):
    ativo_id: int
    descricao: str = Field(min_length=1, max_length=200)
    intervalo_dias: int | None = Field(default=None, gt=0)
    intervalo_horas: int | None = Field(default=None, gt=0)
    ultima_execucao: date | None = None
    proxima_prevista: date | None = None

    @model_validator(mode="after")
    def _exatamente_um_intervalo(self) -> "PlanoCreate":
        # Mesmo CHECK da tabela: ou por dias, ou por horas — nunca os dois.
        if (self.intervalo_dias is None) == (self.intervalo_horas is None):
            raise ValueError("Informe exatamente um entre intervaloDias e intervaloHoras.")
        return self


class PlanoUpdate(CamelModel):
    descricao: str | None = Field(default=None, max_length=200)
    intervalo_dias: int | None = Field(default=None, gt=0)
    intervalo_horas: int | None = Field(default=None, gt=0)
    ultima_execucao: date | None = None
    proxima_prevista: date | None = None
    ativo: bool | None = None


class PlanoExecutarRequest(CamelModel):
    """Marca a execução do plano e recalcula a próxima data prevista."""

    data_execucao: date | None = None
