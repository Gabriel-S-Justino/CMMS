// src/services/providers-service.ts
//
// Prestadores de serviço (GET /prestadores — spec §4).
// Sem EXPO_PUBLIC_API_URL cai no mock, como os demais services.

import { MOCK_PRESTADORES } from '@/data/mock-maintenance';
import { api, isApiConfigured } from '@/services/api';
import { Prestador } from '@/types/providers';

export async function fetchPrestadores(): Promise<Prestador[]> {
  if (!isApiConfigured()) return MOCK_PRESTADORES;

  return api.get<Prestador[]>('/prestadores');
}
