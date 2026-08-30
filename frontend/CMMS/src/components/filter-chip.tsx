// Botão-filtro genérico (bolha "Todos", "Operacional" etc).
// Não sabe nada sobre "status de ativo" especificamente — só recebe label,
// se está ativo e o que fazer ao ser tocado. Por isso é reaproveitável
// em outros filtros do app no futuro.

import { Pressable, StyleSheet, Text } from 'react-native';

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155' },
  labelActive: { color: '#FFFFFF' },
});