// src/services/parts-service.ts
//
// Peças de estoque (GET /pecas — spec §4).

import { MOCK_PECAS } from '@/data/mock-maintenance';
import { api, isApiConfigured } from '@/services/api';
import { Peca } from '@/types/parts';

export async function fetchPecas(): Promise<Peca[]> {
  if (!isApiConfigured()) return MOCK_PECAS;

  return api.get<Peca[]>('/pecas');
}
