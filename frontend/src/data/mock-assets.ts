// Dados falsos para alimentar a Home enquanto o backend não existe.
// Isolado propositalmente: `assets-service` só cai aqui quando
// EXPO_PUBLIC_API_URL não está definida.
//
// O ast-006 tem lastMaintenanceDate null de propósito: é o caso do ativo
// recém-cadastrado, que o AssetCard mostra como "Sem manutenção".

import { Asset, DashboardMetric } from '@/types/assets';

export const MOCK_ASSETS: Asset[] = [
  { id: 'ast-001', name: 'Compressor Atlas 01', category: 'industrialMachine', type: 'Compressor', location: 'Setor A', status: 'operational', lastMaintenanceDate: '2026-07-12', isMaintenanceOverdue: false },
  { id: 'ast-002', name: 'Torno CNC Romi', category: 'industrialMachine', type: 'Torno', location: 'Setor B', status: 'maintenance', lastMaintenanceDate: '2026-08-01', isMaintenanceOverdue: false },
  { id: 'ast-003', name: 'Caminhão Volvo FH', category: 'vehicle', type: 'Caminhão', location: 'Frota', status: 'alert', lastMaintenanceDate: '2026-05-20', isMaintenanceOverdue: true },
  { id: 'ast-004', name: 'Empilhadeira Hyster', category: 'vehicle', type: 'Empilhadeira', location: 'Depósito', status: 'stopped', lastMaintenanceDate: '2026-06-15', isMaintenanceOverdue: true },
  { id: 'ast-005', name: 'Compressor Schulz 02', category: 'industrialMachine', type: 'Compressor', location: 'Setor A', status: 'operational', lastMaintenanceDate: '2026-08-10', isMaintenanceOverdue: false },
  { id: 'ast-006', name: 'Fresadora Universal', category: 'industrialMachine', type: 'Fresadora', location: 'Setor C', status: 'operational', lastMaintenanceDate: null, isMaintenanceOverdue: false },
];

export const MOCK_METRICS: DashboardMetric[] = [
  { id: 'assets', label: 'Ativos cadastrados', value: '24' },
  { id: 'open', label: 'Manutenções em aberto', value: '5' },
  { id: 'alerts', label: 'Alertas ativos', value: '2' },
  { id: 'cost', label: 'Custo do mês', value: 'R$ 8.420' },
];
