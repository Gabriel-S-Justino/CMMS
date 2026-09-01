//ativoDetalhe.style.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, gap: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },

  // --- Cabeçalho ---
  header: { gap: 12 },
  voltar: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  titulo: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitulo: { fontSize: 14, color: '#64748B' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  overdueBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
  },
  overdueText: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },

  // --- Ações ---
  acoes: { flexDirection: 'row', gap: 12 },
  botaoPrimario: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPrimarioTexto: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  botaoPerigo: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPerigoTexto: { fontSize: 14, fontWeight: '700', color: '#B91C1C' },
  botaoDesabilitado: { opacity: 0.55 },

  // --- Cartão de dados ---
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 14,
  },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  linha: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  linhaLabel: { fontSize: 13, color: '#64748B', flexShrink: 1 },
  linhaValor: { fontSize: 13, fontWeight: '600', color: '#0F172A', flexShrink: 1, textAlign: 'right' },

  // --- Abas ---
  abas: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  aba: { flex: 1, minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  abaAtiva: { backgroundColor: '#FFFFFF' },
  abaTexto: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  abaTextoAtivo: { color: '#0F172A' },

  // --- Listas das abas ---
  secao: { gap: 12 },
  secaoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secaoTitulo: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 8,
  },
  itemCardVencido: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  itemCardPressed: { opacity: 0.7 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTitulo: { fontSize: 15, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
  itemMeta: { fontSize: 12, color: '#64748B' },
  itemMetaVencida: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  itemCusto: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

  vazio: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  vazioTitulo: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  vazioTexto: { fontSize: 13, color: '#64748B', textAlign: 'center' },

  erroTexto: { fontSize: 14, color: '#B91C1C', textAlign: 'center' },
  avisoBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 14,
  },
  avisoTexto: { fontSize: 13, color: '#B91C1C', lineHeight: 19 },
});
