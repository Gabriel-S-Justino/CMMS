// src/services/assets-service.ts

// Ponto único de acesso a dados de ativos.
// Hoje conversa com o mock; no futuro troca para fetch/axios sem
// que o resto do app perceba, porque a assinatura das funções continua igual.

import { Asset, DashboardMetric } from '@/types/assets';
import { MOCK_ASSETS, MOCK_METRICS } from '@/data/mock-assets';

export async function fetchAssets(): Promise<Asset[]> {
  // TODO: substituir pela chamada real, ex.:
  // const response = await fetch(`${API_URL}/assets`);
  // if (!response.ok) throw new Error('Falha ao carregar ativos');
  // return response.json();
  return MOCK_ASSETS;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetric[]> {
  // TODO: substituir pela chamada real
  return MOCK_METRICS;
}