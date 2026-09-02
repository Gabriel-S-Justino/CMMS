// src/services/plans-service.ts
//
// Planos de manutenção preventiva (spec §4).

import { MOCK_PLANOS } from '@/data/mock-maintenance';
import { api, isApiConfigured } from '@/services/api';
import { PlanoInput, PlanoPreventiva } from '@/types/plans';

export async function fetchPlanos(filtros?: {
  ativoId?: number;
  apenasAtivos?: boolean;
}): Promise<PlanoPreventiva[]> {
  if (!isApiConfigured()) {
    const lista = filtros?.ativoId
      ? MOCK_PLANOS.filter((p) => p.ativoId === filtros.ativoId)
      : MOCK_PLANOS;
    return filtros?.apenasAtivos ? lista.filter((p) => p.ativo) : lista;
  }

  const query = new URLSearchParams();
  if (filtros?.ativoId !== undefined) query.set('ativoId', String(filtros.ativoId));
  if (filtros?.apenasAtivos) query.set('apenasAtivos', 'true');

  const sufixo = query.toString();
  return api.get<PlanoPreventiva[]>(`/planos${sufixo ? `?${sufixo}` : ''}`);
}

export async function fetchPlano(id: number): Promise<PlanoPreventiva> {
  if (!isApiConfigured()) {
    const encontrado = MOCK_PLANOS.find((p) => p.id === id);
    if (!encontrado) throw new Error('Plano não encontrado.');
    return encontrado;
  }

  // O backend não expõe GET /planos/{id}: filtramos a listagem, que já vem
  // no escopo do usuário.
  const planos = await api.get<PlanoPreventiva[]>('/planos');
  const encontrado = planos.find((p) => p.id === id);
  if (!encontrado) throw new Error('Plano não encontrado.');
  return encontrado;
}

export async function createPlano(dados: PlanoInput): Promise<PlanoPreventiva> {
  if (!isApiConfigured()) {
    return { ...MOCK_PLANOS[0], ...dados, id: Date.now(), ativo: true } as PlanoPreventiva;
  }

  return api.post<PlanoPreventiva>('/planos', dados);
}

export async function updatePlano(
  id: number,
  dados: Partial<Omit<PlanoInput, 'ativoId'>> & { ativo?: boolean },
): Promise<PlanoPreventiva> {
  if (!isApiConfigured()) return { ...(await fetchPlano(id)), ...dados } as PlanoPreventiva;

  return api.patch<PlanoPreventiva>(`/planos/${id}`, dados);
}

export async function deletePlano(id: number): Promise<void> {
  if (!isApiConfigured()) return;

  await api.delete<void>(`/planos/${id}`);
}

/** POST /planos/{id}/executar — marca a execução e recalcula a próxima prevista. */
export async function executarPlano(
  id: number,
  dataExecucao?: string,
): Promise<PlanoPreventiva> {
  if (!isApiConfigured()) return fetchPlano(id);

  return api.post<PlanoPreventiva>(`/planos/${id}/executar`, {
    dataExecucao: dataExecucao ?? null,
  });
}
