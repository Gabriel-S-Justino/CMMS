// "Pílula" colorida de status (bolinha + texto).
// Reutilizável em qualquer lugar do app que precise mostrar o status de um ativo,
// não só no card da Home.

import { StyleSheet, Text, View } from 'react-native';

import { STATUS_COLORS, STATUS_LABELS } from '@/constants/asset-status';
import { AssetStatus } from '@/types/assets';

type StatusBadgeProps = {
  status: AssetStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
      <Text style={[styles.label, { color: colors.text }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '600' },
});