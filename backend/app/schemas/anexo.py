from datetime import datetime

from app.models.enums import TipoAnexo
from app.schemas.common import CamelModel


class AnexoOut(CamelModel):
    id: int
    manutencao_id: int | None = None
    ativo_id: int | None = None
    tipo: TipoAnexo
    nome_original: str | None = None
    mime_type: str | None = None
    tamanho_bytes: int | None = None
    enviado_por: int | None = None
    criado_em: datetime
    # URL assinada e temporária; o caminho real do arquivo nunca é exposto.
    download_url: str | None = None
