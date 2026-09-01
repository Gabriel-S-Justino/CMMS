// Contratos dos planos de manutenção preventiva (spec §2.2 e §4).

export type PlanoPreventiva = {
  id: number;
  ativoId: number;
  descricao: string;
  // O backend exige EXATAMENTE um dos dois (CHECK na tabela).
  intervaloDias: number | null;
  intervaloHoras: number | null;
  ultimaExecucao: string | null;
  proximaPrevista: string | null;
  ativo: boolean;
  criadoEm: string;
};

/** Resumo que vem embutido em GET /ativos/{id} (sem `criadoEm`). */
export type PlanoResumo = Omit<PlanoPreventiva, 'ativoId' | 'criadoEm'>;

export type PlanoInput = {
  ativoId: number;
  descricao: string;
  intervaloDias?: number | null;
  intervaloHoras?: number | null;
  ultimaExecucao?: string | null;
  proximaPrevista?: string | null;
};
