// src/services/maintenance-service.ts
//
// Manutenções e as peças usadas em cada uma (spec §4).
// Sem EXPO_PUBLIC_API_URL cai nos mocks — as escritas viram no-op sobre o mock,
// só para a navegação das telas continuar funcionando sem backend.

import { MOCK_MANUTENCOES } from '@/data/mock-maintenance';
import { api, isApiConfigured } from '@/services/api';
import {
  Manutencao,
  ManutencaoInput,
  ManutencaoUpdate,
  StatusManutencao,
} from '@/types/maintenance';

function mockPorAtivo(ativoId: number): Manutencao[] {
  return MOCK_MANUTENCOES.filter((m) => m.ativoId === ativoId);
}

export async function fetchManutencoes(filtros?: {
  ativoId?: number;
  status?: StatusManutencao;
}): Promise<Manutencao[]> {
  if (!isApiConfigured()) {
    const lista = filtros?.ativoId ? mockPorAtivo(filtros.ativoId) : MOCK_MANUTENCOES;
    return filtros?.status ? lista.filter((m) => m.status === filtros.status) : lista;
  }

  const query = new URLSearchParams();
  if (filtros?.ativoId !== undefined) query.set('ativoId', String(filtros.ativoId));
  if (filtros?.status) query.set('status', filtros.status);

  const sufixo = query.toString();
  return api.get<Manutencao[]>(`/manutencoes${sufixo ? `?${sufixo}` : ''}`);
}

export async function fetchManutencao(id: number): Promise<Manutencao> {
  if (!isApiConfigured()) {
    const encontrada = MOCK_MANUTENCOES.find((m) => m.id === id);
    if (!encontrada) throw new Error('Manutenção não encontrada.');
    return encontrada;
  }

  return api.get<Manutencao>(`/manutencoes/${id}`);
}

export async function createManutencao(dados: ManutencaoInput): Promise<Manutencao> {
  if (!isApiConfigured()) {
    return {
      ...MOCK_MANUTENCOES[0],
      ...dados,
      id: Date.now(),
      prestadorId: dados.prestadorId ?? null,
      status: 'aberta',
      pecas: [],
    } as Manutencao;
  }

  return api.post<Manutencao>('/manutencoes', dados);
}

export async function updateManutencao(
  id: number,
  dados: ManutencaoUpdate,
): Promise<Manutencao> {
  if (!isApiConfigured()) return { ...(await fetchManutencao(id)), ...dados } as Manutencao;

  return api.patch<Manutencao>(`/manutencoes/${id}`, dados);
}

export async function deleteManutencao(id: number): Promise<void> {
  if (!isApiConfigured()) return;

  await api.delete<void>(`/manutencoes/${id}`);
}

/** Muda só o status — usado pelos botões Concluir e Cancelar. */
export async function alterarStatusManutencao(
  id: number,
  status: StatusManutencao,
  dataConclusao?: string | null,
): Promise<Manutencao> {
  return updateManutencao(id, { status, dataConclusao });
}

// --- Peças da manutenção ----------------------------------------------------

export async function adicionarPeca(
  manutencaoId: number,
  dados: { pecaId: number; quantidade: string; custoUnitarioNaData?: string | null },
): Promise<Manutencao> {
  if (!isApiConfigured()) return fetchManutencao(manutencaoId);

  return api.post<Manutencao>(`/manutencoes/${manutencaoId}/pecas`, dados);
}

export async function removerPeca(manutencaoId: number, pecaId: number): Promise<void> {
  if (!isApiConfigured()) return;

  await api.delete<void>(`/manutencoes/${manutencaoId}/pecas/${pecaId}`);
}
