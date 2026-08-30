// Contratos de dados do domínio de "ativos" (máquinas, compressores, veículos).
// Não tem lógica — só tipagem. Garante que componentes, mocks e futura API
// falem a mesma "língua" sobre o que é um Asset.

export type AssetType = 'machine' | 'compressor' | 'vehicle';

export type AssetStatus = 'operational' | 'maintenance' | 'stopped' | 'alert';

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  location: string;
  status: AssetStatus;
  lastMaintenanceDate: string; // ISO: '2026-07-12'
  isMaintenanceOverdue: boolean;
};

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
};