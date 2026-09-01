// src/services/assets-service.ts
//
// Ponto único de acesso a dados de ativos e métricas do dashboard.
// Com EXPO_PUBLIC_API_URL definida fala com o backend
// (GET /ativos e GET /dashboard/metricas — docs/cmms-backend-spec.md §4).
// Sem ela, cai nos mocks, pra o app continuar rodando sem backend no ar.

import { MOCK_ASSETS, MOCK_METRICS } from '@/data/mock-assets';
import { MOCK_MANUTENCOES, MOCK_PLANOS } from '@/data/mock-maintenance';
import { api, isApiConfigured } from '@/services/api';
import {
  Asset,
  AssetDetalhe,
  AssetInput,
  AssetStatus,
  DashboardMetric,
} from '@/types/assets';

export type AssetFilters = {
  /** Casa com `?busca=` — o backend procura em nome, código, patrimônio e localização. */
  busca?: string;
  status?: AssetStatus;
};

function filtrarMock(filtros?: AssetFilters): Asset[] {
  const termo = filtros?.busca?.trim().toLowerCase() ?? '';

  return MOCK_ASSETS.filter((asset) => {
    const casaStatus = !filtros?.status || asset.status === filtros.status;
    const casaBusca =
      !termo ||
      asset.name.toLowerCase().includes(termo) ||
      asset.location.toLowerCase().includes(termo);
    return casaStatus && casaBusca;
  });
}

export async function fetchAssets(
  filtros?: AssetFilters,
  options?: { signal?: AbortSignal },
): Promise<Asset[]> {
  if (!isApiConfigured()) return filtrarMock(filtros);

  // A filtragem é do servidor: com muitos ativos, filtrar no cliente exigiria
  // baixar a base inteira a cada busca.
  const query = new URLSearchParams();
  if (filtros?.busca?.trim()) query.set('busca', filtros.busca.trim());
  if (filtros?.status) query.set('status', filtros.status);

  const sufixo = query.toString();
  return api.get<Asset[]>(`/ativos${sufixo ? `?${sufixo}` : ''}`, { signal: options?.signal });
}

export async function fetchDashboardMetrics(options?: {
  signal?: AbortSignal;
}): Promise<DashboardMetric[]> {
  if (!isApiConfigured()) return MOCK_METRICS;

  return api.get<DashboardMetric[]>('/dashboard/metricas', { signal: options?.signal });
}

// --- Detalhe e escrita ------------------------------------------------------

function detalheMock(id: number): AssetDetalhe {
  const base = MOCK_ASSETS.find((a) => a.id === String(id)) ?? MOCK_ASSETS[0];

  return {
    id,
    nome: base.name,
    categoria: base.category,
    tipo: base.type,
    codigo: null,
    patrimonio: null,
    fabricante: null,
    modelo: null,
    ano: null,
    numeroSerie: null,
    localizacao: base.location,
    responsavel: null,
    status: base.status,
    horimetroAtual: null,
    quilometragem: null,
    dataAquisicao: null,
    fornecedor: null,
    valorAquisicao: null,
    numeroNotaFiscal: null,
    garantiaAte: null,
    observacoes: null,
    especificacoes: {},
    criadoPor: null,
    atualizadoPor: null,
    criadoEm: new Date().toISOString(),
    atualizadoEm: null,
    ultimaManutencao: base.lastMaintenanceDate,
    manutencaoAtrasada: base.isMaintenanceOverdue,
    manutencoes: MOCK_MANUTENCOES.filter((m) => m.ativoId === id).map((m) => ({
      id: m.id,
      tipo: m.tipo,
      status: m.status,
      descricao: m.descricao,
      dataServico: m.dataServico,
      custoTotal: m.custoTotal,
    })),
    planos: MOCK_PLANOS.filter((p) => p.ativoId === id).map(
      ({ ativoId: _ativoId, criadoEm: _criadoEm, ...resto }) => resto,
    ),
  };
}

export async function fetchAsset(id: number): Promise<AssetDetalhe> {
  if (!isApiConfigured()) return detalheMock(id);

  return api.get<AssetDetalhe>(`/ativos/${id}`);
}

export async function createAsset(dados: AssetInput): Promise<AssetDetalhe> {
  if (!isApiConfigured()) return detalheMock(Date.now());

  return api.post<AssetDetalhe>('/ativos', dados);
}

export async function updateAsset(
  id: number,
  dados: Partial<AssetInput>,
): Promise<AssetDetalhe> {
  if (!isApiConfigured()) return detalheMock(id);

  return api.patch<AssetDetalhe>(`/ativos/${id}`, dados);
}

export async function deleteAsset(id: number): Promise<void> {
  if (!isApiConfigured()) return;

  await api.delete<void>(`/ativos/${id}`);
}
