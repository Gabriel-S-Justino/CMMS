// Dados falsos para as telas de manutenção, plano, prestador e peça rodarem
// sem backend. Os services só caem aqui quando EXPO_PUBLIC_API_URL não está
// definida — mesma regra do mock-assets.

import { Manutencao } from '@/types/maintenance';
import { Peca } from '@/types/parts';
import { PlanoPreventiva } from '@/types/plans';
import { Prestador } from '@/types/providers';

export const MOCK_PRESTADORES: Prestador[] = [
  { id: 1, nome: 'Oficina Central', cnpjCpf: '12.345.678/0001-90', telefone: '(85) 3333-1010', email: 'contato@oficinacentral.com.br', tipo: 'externo', criadoEm: '2026-01-10T12:00:00Z' },
  { id: 2, nome: 'Equipe interna de manutenção', cnpjCpf: null, telefone: null, email: null, tipo: 'interno', criadoEm: '2026-01-10T12:00:00Z' },
  { id: 3, nome: 'Hidráulica Souza', cnpjCpf: '98.765.432/0001-10', telefone: '(85) 3222-4545', email: 'souza@hidraulica.com.br', tipo: 'externo', criadoEm: '2026-02-01T12:00:00Z' },
];

export const MOCK_PECAS: Peca[] = [
  { id: 1, nome: 'Filtro de óleo', codigo: 'FLT-001', unidade: 'un', custoUnitarioAtual: '48.90', estoque: '25', criadoEm: '2026-01-10T12:00:00Z' },
  { id: 2, nome: 'Correia dentada', codigo: 'COR-014', unidade: 'un', custoUnitarioAtual: '132.50', estoque: '8', criadoEm: '2026-01-10T12:00:00Z' },
  { id: 3, nome: 'Óleo hidráulico ISO 68', codigo: 'OLE-068', unidade: 'l', custoUnitarioAtual: '29.90', estoque: '140', criadoEm: '2026-01-10T12:00:00Z' },
  { id: 4, nome: 'Rolamento 6204', codigo: 'ROL-6204', unidade: 'un', custoUnitarioAtual: '37.00', estoque: '16', criadoEm: '2026-01-10T12:00:00Z' },
];

export const MOCK_MANUTENCOES: Manutencao[] = [
  {
    id: 1, ativoId: 1, prestadorId: 1, tipo: 'preventiva', status: 'concluida',
    descricao: 'Troca de óleo e filtros das 500 horas.',
    dataAbertura: '2026-07-10T09:00:00Z', dataServico: '2026-07-12', dataConclusao: '2026-07-12',
    horimetroNoServico: '512', custoMaoDeObra: '180.00', custoPecas: '97.80', custoTotal: '277.80',
    criadoPor: 1, criadoEm: '2026-07-10T09:00:00Z',
    pecas: [{ pecaId: 1, quantidade: '2', custoUnitarioNaData: '48.90' }],
  },
  {
    id: 2, ativoId: 1, prestadorId: 2, tipo: 'corretiva', status: 'aberta',
    descricao: 'Vazamento na linha de ar comprimido.',
    dataAbertura: '2026-08-28T14:30:00Z', dataServico: null, dataConclusao: null,
    horimetroNoServico: null, custoMaoDeObra: '0.00', custoPecas: '0.00', custoTotal: '0.00',
    criadoPor: 1, criadoEm: '2026-08-28T14:30:00Z', pecas: [],
  },
  {
    id: 3, ativoId: 3, prestadorId: 1, tipo: 'preditiva', status: 'em_andamento',
    descricao: 'Análise de vibração do eixo traseiro.',
    dataAbertura: '2026-08-30T08:00:00Z', dataServico: '2026-09-02', dataConclusao: null,
    horimetroNoServico: '18400', custoMaoDeObra: '250.00', custoPecas: '0.00', custoTotal: '250.00',
    criadoPor: 1, criadoEm: '2026-08-30T08:00:00Z', pecas: [],
  },
];

export const MOCK_PLANOS: PlanoPreventiva[] = [
  { id: 1, ativoId: 1, descricao: 'Troca de óleo e filtros', intervaloDias: 90, intervaloHoras: null, ultimaExecucao: '2026-07-12', proximaPrevista: '2026-10-10', ativo: true, criadoEm: '2026-01-15T12:00:00Z' },
  { id: 2, ativoId: 1, descricao: 'Revisão geral das 1000 horas', intervaloDias: null, intervaloHoras: 1000, ultimaExecucao: null, proximaPrevista: null, ativo: true, criadoEm: '2026-01-15T12:00:00Z' },
  { id: 3, ativoId: 3, descricao: 'Inspeção de freios', intervaloDias: 60, intervaloHoras: null, ultimaExecucao: '2026-05-20', proximaPrevista: '2026-07-19', ativo: true, criadoEm: '2026-01-15T12:00:00Z' },
];
