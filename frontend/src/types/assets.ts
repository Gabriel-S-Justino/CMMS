// Contratos de dados do domínio de "ativos" (máquinas, veículos, equipamentos...).
// Não tem lógica — só tipagem. Garante que componentes, mocks e a API
// falem a mesma "língua" sobre o que é um Asset.
//
// Os valores de `Categoria` e `AssetStatus` são exatamente os mesmos dos enums
// `categoria_ativo` e `status_ativo` do backend (docs/cmms-backend-spec.md §2.2).

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
