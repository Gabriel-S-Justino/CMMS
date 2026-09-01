// Contratos de dados do domínio de "ativos" (máquinas, veículos, equipamentos...).
// Não tem lógica — só tipagem. Garante que componentes, mocks e a API
// falem a mesma "língua" sobre o que é um Asset.
//
// Os valores de `Categoria` e `AssetStatus` são exatamente os mesmos dos enums
// `categoria_ativo` e `status_ativo` do backend (docs/cmms-backend-spec.md §2.2).

import { ManutencaoResumo } from '@/types/maintenance';
import { PlanoResumo } from '@/types/plans';

export type Categoria =
  | 'vehicle'
  | 'industrialMachine'
  | 'equipment'
  | 'electrical'
  | 'infrastructure'
  | 'other';

export type AssetStatus = 'operational' | 'maintenance' | 'stopped' | 'alert';

export type Asset = {
  id: string;
  name: string;
  category: Categoria;
  type: string; // texto livre vindo do TIPOS_POR_CATEGORIA: 'Torno', 'Caminhão'...
  location: string;
  status: AssetStatus;
  lastMaintenanceDate: string | null; // ISO: '2026-07-12'; null se o ativo nunca teve manutenção
  isMaintenanceOverdue: boolean;
};

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
};

/** Detalhe completo de GET /ativos/{id} — os campos do ativo + listas embutidas. */
export type AssetDetalhe = {
  id: number;
  nome: string;
  categoria: Categoria;
  tipo: string | null;
  codigo: string | null;
  patrimonio: string | null;
  fabricante: string | null;
  modelo: string | null;
  ano: number | null;
  numeroSerie: string | null;
  localizacao: string | null;
  responsavel: string | null;
  status: AssetStatus;
  horimetroAtual: string | null;
  quilometragem: string | null;
  dataAquisicao: string | null;
  fornecedor: string | null;
  valorAquisicao: string | null;
  numeroNotaFiscal: string | null;
  garantiaAte: string | null;
  observacoes: string | null;
  /** Campos por categoria: placa/renavam/chassi/combustivel, potencia/tensao/capacidade. */
  especificacoes: Record<string, string | null>;
  criadoPor: number | null;
  atualizadoPor: number | null;
  criadoEm: string;
  atualizadoEm: string | null;
  ultimaManutencao: string | null;
  manutencaoAtrasada: boolean;
  manutencoes: ManutencaoResumo[];
  planos: PlanoResumo[];
};

/** Corpo de POST /ativos e PATCH /ativos/{id} (campos por categoria vão soltos). */
export type AssetInput = {
  nome: string;
  categoria: Categoria;
  tipo?: string | null;
  codigo?: string | null;
  patrimonio?: string | null;
  fabricante?: string | null;
  modelo?: string | null;
  ano?: number | null;
  numeroSerie?: string | null;
  localizacao?: string | null;
  responsavel?: string | null;
  status?: AssetStatus;
  horimetroAtual?: string | null;
  quilometragem?: string | null;
  dataAquisicao?: string | null;
  fornecedor?: string | null;
  valorAquisicao?: string | null;
  numeroNotaFiscal?: string | null;
  garantiaAte?: string | null;
  observacoes?: string | null;
  placa?: string | null;
  renavam?: string | null;
  chassi?: string | null;
  combustivel?: string | null;
  potencia?: string | null;
  tensao?: string | null;
  capacidade?: string | null;
};
