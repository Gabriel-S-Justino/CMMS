"""Cálculo da próxima preventiva."""

from datetime import date, timedelta

from app.models.plano_preventiva import PlanoPreventiva


def proxima_data(plano: PlanoPreventiva, a_partir_de: date) -> date | None:
    """Planos por dias avançam no calendário; por horas dependem do horímetro."""
    if plano.intervalo_dias:
        return a_partir_de + timedelta(days=plano.intervalo_dias)

    # Intervalo por horas não tem data prevista até o horímetro ser lançado.
    return None


def executar(plano: PlanoPreventiva, data_execucao: date) -> None:
    plano.ultima_execucao = data_execucao
    plano.proxima_prevista = proxima_data(plano, data_execucao)
