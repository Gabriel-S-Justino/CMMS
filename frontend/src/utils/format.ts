// Conversões entre o que o usuário digita/lê e o que a API troca.
//
// A API fala ISO (`2026-09-01`) e manda números decimais como string, para não
// perder centavos no float do JavaScript. O usuário fala dd/mm/aaaa e vírgula.
// Toda a tradução mora aqui — nada de `split('/')` espalhado por tela.

/** '2026-09-01' -> '01/09/2026'. Devolve '—' para nulo. */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';

  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return '—';

  return `${dia}/${mes}/${ano}`;
}

/** '2026-09-01T14:30:00Z' -> '01/09/2026 14:30'. */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return '—';

  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';

  return `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** Aplica a máscara dd/mm/aaaa enquanto o usuário digita. */
export function mascaraData(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/**
 * '01/09/2026' -> '2026-09-01' (o formato que a API espera).
 * Devolve null se estiver incompleta ou não existir no calendário
 * (31/02 não passa: o Date normalizaria para 03/03 em silêncio).
 */
export function dataParaISO(texto: string): string | null {
  const partes = texto.trim().split('/');
  if (partes.length !== 3) return null;

  const [dia, mes, ano] = partes;
  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) return null;

  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const valida =
    data.getFullYear() === Number(ano) &&
    data.getMonth() === Number(mes) - 1 &&
    data.getDate() === Number(dia);

  return valida ? `${ano}-${mes}-${dia}` : null;
}

/** '2026-09-01' -> '01/09/2026' para preencher um campo editável. */
export function isoParaData(iso: string | null | undefined): string {
  if (!iso) return '';

  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '';
}

/** Hoje em ISO, no fuso local (não em UTC, que viraria o dia à noite no Brasil). */
export function hojeISO(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

/** true se a data ISO já passou (usado no destaque de plano vencido). */
export function estaVencida(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) < hojeISO();
}

// --- Números ----------------------------------------------------------------

/** '277.80' -> 'R$ 277,80'. Aceita o decimal em string que a API devolve. */
export function formatarMoeda(valor: string | number | null | undefined): string {
  const numero = typeof valor === 'string' ? Number(valor) : (valor ?? 0);
  if (!Number.isFinite(numero)) return 'R$ 0,00';

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

/** '1.234,56' ou '1234.56' -> '1234.56' (o que a API aceita). Null se vazio/inválido. */
export function numeroParaAPI(texto: string): string | null {
  const limpo = texto.trim().replace(/\s/g, '');
  if (!limpo) return null;

  // Se tem vírgula, ela é o separador decimal e o ponto é de milhar.
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo;

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? String(numero) : null;
}

/** '277.80' -> '277,80' para preencher um campo editável. */
export function numeroParaCampo(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '';

  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (!Number.isFinite(numero)) return '';

  return String(numero).replace('.', ',');
}
