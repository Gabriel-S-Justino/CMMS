// src/services/assets-service.ts
//
// Ponto único de acesso a dados de ativos e métricas do dashboard.
// Com EXPO_PUBLIC_API_URL definida fala com o backend
// (GET /ativos e GET /dashboard/metricas — docs/cmms-backend-spec.md §4).
// Sem ela, cai nos mocks, pra o app continuar rodando sem backend no ar.

import { api, isApiConfigured } from '@/services/api';
import { Asset, DashboardMetric } from '@/types/assets';
import { MOCK_ASSETS, MOCK_METRICS } from '@/data/mock-assets';

export async function fetchAssets(): Promise<Asset[]> {
  if (!isApiConfigured()) return MOCK_ASSETS;

  return api.get<Asset[]>('/ativos');
}

export async function fetchDashboardMetrics(): Promise<DashboardMetric[]> {
  if (!isApiConfigured()) return MOCK_METRICS;

  return api.get<DashboardMetric[]>('/dashboard/metricas');
}
