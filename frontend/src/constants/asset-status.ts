// Central de tradução e estilo por status/categoria de ativo.
// Evita espalhar "if (status === 'operational') return 'verde'" pelos componentes:
// se o texto ou a cor de um status mudar, muda só aqui.

import { AssetStatus, Categoria } from '@/types/assets';

export const STATUS_LABELS: Record<AssetStatus, string> = {
  operational: 'Operacional',
  maintenance: 'Em manutenção',
  stopped: 'Parado',
  alert: 'Alerta',
};

export const STATUS_COLORS: Record<AssetStatus, { text: string; background: string }> = {
  operational: { text: '#15803D', background: '#DCFCE7' },
  maintenance: { text: '#B45309', background: '#FEF3C7' },
  stopped: { text: '#B91C1C', background: '#FEE2E2' },
  alert: { text: '#B91C1C', background: '#FEE2E2' },
};

export const CATEGORY_LABELS: Record<Categoria, string> = {
  vehicle: 'Veículo',
  industrialMachine: 'Máquina industrial',
  equipment: 'Equipamento',
  electrical: 'Equipamento elétrico',
  infrastructure: 'Infraestrutura',
  other: 'Outro',
};
