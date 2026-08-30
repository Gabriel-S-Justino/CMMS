// Dados falsos para alimentar a Home antes de existir um backend.
// Isolado propositalmente: é a única peça pensada para ser descartada/substituída
// por uma chamada de API real, sem tocar nos componentes ou na tela.

import { Asset, DashboardMetric } from '@/types/assets';

export const MOCK_ASSETS: Asset[] = [
  { id: 'ast-001', name: 'Compressor Atlas 01', type: 'compressor', location: 'Setor A', status: 'operational', lastMaintenanceDate: '2026-07-12', isMaintenanceOverdue: false },
  { id: 'ast-002', name: 'Torno CNC Romi', type: 'machine', location: 'Setor B', status: 'maintenance', lastMaintenanceDate: '2026-08-01', isMaintenanceOverdue: false },
  { id: 'ast-003', name: 'Caminhão Volvo FH', type: 'vehicle', location: 'Frota', status: 'alert', lastMaintenanceDate: '2026-05-20', isMaintenanceOverdue: true },
  { id: 'ast-004', name: 'Empilhadeira Hyster', type: 'vehicle', location: 'Depósito', status: 'stopped', lastMaintenanceDate: '2026-06-15', isMaintenanceOverdue: true },
  { id: 'ast-005', name: 'Compressor Schulz 02', type: 'compressor', location: 'Setor A', status: 'operational', lastMaintenanceDate: '2026-08-10', isMaintenanceOverdue: false },
  { id: 'ast-006', name: 'Fresadora Universal', type: 'machine', location: 'Setor C', status: 'operational', lastMaintenanceDate: '2026-07-28', isMaintenanceOverdue: false },
];

export const MOCK_METRICS: DashboardMetric[] = [
  { id: 'assets', label: 'Ativos cadastrados', value: '24' },
  { id: 'open', label: 'Manutenções em aberto', value: '5' },
  { id: 'alerts', label: 'Alertas ativos', value: '2' },
  { id: 'cost', label: 'Custo do mês', value: 'R$ 8.420' },
];