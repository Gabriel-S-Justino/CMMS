// Contratos de prestadores de serviço (spec §2.2).

export type TipoPrestador = 'interno' | 'externo';

export type Prestador = {
  id: number;
  nome: string;
  cnpjCpf: string | null;
  telefone: string | null;
  email: string | null;
  tipo: TipoPrestador | null;
  criadoEm: string;
};
