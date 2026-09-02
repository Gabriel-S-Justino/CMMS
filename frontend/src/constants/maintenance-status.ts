// Central de tradução e estilo do domínio de manutenções — mesma ideia do
// asset-status.ts: nada de `if (status === 'concluida')` espalhado por tela.

import { StatusManutencao, TipoManutencao } from '@/types/maintenance';

export const TIPO_MANUTENCAO_LABELS: Record<TipoManutencao, string> = {
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
  preditiva: 'Preditiva',
};

export const STATUS_MANUTENCAO_LABELS: Record<StatusManutencao, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const STATUS_MANUTENCAO_COLORS: Record<
  StatusManutencao,
  { text: string; background: string }
> = {
  aberta: { text: '#1D4ED8', background: '#DBEAFE' },
  em_andamento: { text: '#B45309', background: '#FEF3C7' },
  concluida: { text: '#15803D', background: '#DCFCE7' },
  cancelada: { text: '#475569', background: '#E2E8F0' },
};

/** Ordem em que as opções aparecem nos seletores do formulário. */
export const TIPOS_MANUTENCAO: TipoManutencao[] = ['preventiva', 'corretiva', 'preditiva'];

/**
 * Para quais status cada status pode transitar pela UI.
 * Uma manutenção concluída ou cancelada é ponto final: não volta atrás por aqui.
 */
export const TRANSICOES_PERMITIDAS: Record<StatusManutencao, StatusManutencao[]> = {
  aberta: ['em_andamento', 'concluida', 'cancelada'],
  em_andamento: ['concluida', 'cancelada'],
  concluida: [],
  cancelada: [],
};
