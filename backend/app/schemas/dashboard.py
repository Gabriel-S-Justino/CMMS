from app.schemas.common import CamelModel


class DashboardMetric(CamelModel):
    """Espelha o type DashboardMetric do front: tudo string."""

    id: str
    label: str
    value: str
