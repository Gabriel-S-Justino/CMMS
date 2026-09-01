// Contratos de peças de estoque (spec §2.2).

export type Peca = {
  id: number;
  nome: string;
  codigo: string | null;
  unidade: string | null;
  // numeric do Postgres: chega como string para não perder precisão.
  custoUnitarioAtual: string | null;
  estoque: string;
  criadoEm: string;
};
