// Contratos do domínio de manutenções (docs/cmms-backend-spec.md §2.2 e §4).
// Os valores de `TipoManutencao` e `StatusManutencao` são exatamente os enums
// `tipo_manutencao` e `status_manutencao` do backend.

export type TipoManutencao = 'preventiva' | 'corretiva' | 'preditiva';

export type StatusManutencao = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';

/** Peça usada numa manutenção. O custo unitário é congelado no momento do uso. */
export type ManutencaoPeca = {
  pecaId: number;
  quantidade: string;
  custoUnitarioNaData: string;
};

export type Manutencao = {
  id: number;
  ativoId: number;
  prestadorId: number | null;
  tipo: TipoManutencao;
  status: StatusManutencao;
  descricao: string | null;
  dataAbertura: string;
  dataServico: string | null;
  dataConclusao: string | null;
  horimetroNoServico: string | null;
  // Os campos de custo são numeric no Postgres e chegam como string no JSON,
  // para não perder centavos no float do JavaScript.
  custoMaoDeObra: string;
  custoPecas: string;
  custoTotal: string;
  criadoPor: number | null;
  criadoEm: string;
  pecas: ManutencaoPeca[];
};

/** Resumo que vem embutido em GET /ativos/{id}. */
export type ManutencaoResumo = {
  id: number;
  tipo: TipoManutencao;
  status: StatusManutencao;
  descricao: string | null;
  dataServico: string | null;
  custoTotal: string;
};

export type ManutencaoInput = {
  ativoId: number;
  prestadorId?: number | null;
  tipo: TipoManutencao;
  descricao?: string | null;
  dataServico?: string | null;
  horimetroNoServico?: string | null;
  custoMaoDeObra?: string;
};

export type ManutencaoUpdate = Partial<Omit<ManutencaoInput, 'ativoId'>> & {
  status?: StatusManutencao;
  dataConclusao?: string | null;
};
