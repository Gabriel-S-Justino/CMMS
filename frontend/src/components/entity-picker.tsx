// Seletor genérico com busca, em modal. Serve para prestador (GET /prestadores)
// e peça (GET /pecas) — por isso não conhece nenhum dos dois: recebe a lista
// já carregada e funções para extrair id, título e subtítulo de cada item.

import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type EntityPickerProps<T> = {
  label: string;
  /** Rótulo do item escolhido; null mostra o placeholder. */
  valorSelecionado: string | null;
  placeholder?: string;
  itens: T[];
  carregando?: boolean;
  erro?: string | null;
  editable?: boolean;
  /** Mostra a opção "Nenhum" no topo da lista (campos opcionais). */
  permiteLimpar?: boolean;
  chaveDe: (item: T) => string | number;
  tituloDe: (item: T) => string;
  subtituloDe?: (item: T) => string | null;
  onSelecionar: (item: T | null) => void;
};

export function EntityPicker<T>({
  label,
  valorSelecionado,
  placeholder = 'Selecionar',
  itens,
  carregando = false,
  erro = null,
  editable = true,
  permiteLimpar = false,
  chaveDe,
  tituloDe,
  subtituloDe,
  onSelecionar,
}: EntityPickerProps<T>) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');

  // Busca local: as listas de prestadores e peças são curtas e já vêm inteiras
  // do backend, então filtrar aqui evita uma ida ao servidor por tecla.
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;

    return itens.filter((item) => {
      const subtitulo = subtituloDe?.(item) ?? '';
      return `${tituloDe(item)} ${subtitulo}`.toLowerCase().includes(termo);
    });
  }, [busca, itens, tituloDe, subtituloDe]);

  const fechar = () => {
    setAberto(false);
    setBusca('');
  };

  const escolher = (item: T | null) => {
    onSelecionar(item);
    fechar();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        style={[styles.trigger, !editable && styles.triggerDisabled]}
        onPress={() => editable && setAberto(true)}
        disabled={!editable}
      >
        <Text style={valorSelecionado ? styles.triggerText : styles.triggerPlaceholder}>
          {valorSelecionado ?? placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      {erro ? <Text style={styles.error}>{erro}</Text> : null}

      <Modal visible={aberto} animationType="slide" transparent onRequestClose={fechar}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={fechar} hitSlop={12}>
                <Text style={styles.fechar}>Fechar</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {carregando ? (
              <ActivityIndicator style={styles.loading} color="#2563EB" />
            ) : (
              <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
                {permiteLimpar && (
                  <Pressable style={styles.item} onPress={() => escolher(null)}>
                    <Text style={styles.itemTituloNeutro}>Nenhum</Text>
                  </Pressable>
                )}

                {filtrados.map((item) => {
                  const subtitulo = subtituloDe?.(item);

                  return (
                    <Pressable
                      key={chaveDe(item)}
                      style={styles.item}
                      onPress={() => escolher(item)}
                    >
                      <Text style={styles.itemTitulo}>{tituloDe(item)}</Text>
                      {subtitulo ? <Text style={styles.itemSubtitulo}>{subtitulo}</Text> : null}
                    </Pressable>
                  );
                })}

                {filtrados.length === 0 && (
                  <Text style={styles.vazio}>Nenhum resultado para esta busca.</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  trigger: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  triggerDisabled: { opacity: 0.6 },
  triggerText: { fontSize: 15, color: '#0F172A', flexShrink: 1 },
  triggerPlaceholder: { fontSize: 15, color: '#94A3B8', flexShrink: 1 },
  chevron: { fontSize: 14, color: '#64748B', marginLeft: 8 },
  error: { fontSize: 12, color: '#DC2626', marginTop: 6 },

  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '80%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  fechar: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  loading: { paddingVertical: 32 },
  lista: { flexGrow: 0 },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 2,
  },
  itemTitulo: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  itemTituloNeutro: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  itemSubtitulo: { fontSize: 12, color: '#64748B' },
  vazio: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingVertical: 24 },
});
