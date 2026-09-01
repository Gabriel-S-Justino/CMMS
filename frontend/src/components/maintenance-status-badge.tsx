// "Pílula" de status de manutenção — irmã da StatusBadge dos ativos, com as
// cores e labels vindo de constants/maintenance-status.ts.

import { StyleSheet, Text, View } from 'react-native';

import {
  STATUS_MANUTENCAO_COLORS,
  STATUS_MANUTENCAO_LABELS,
} from '@/constants/maintenance-status';
import { StatusManutencao } from '@/types/maintenance';

type MaintenanceStatusBadgeProps = {
  status: StatusManutencao;
};

export function MaintenanceStatusBadge({ status }: MaintenanceStatusBadgeProps) {
  const colors = STATUS_MANUTENCAO_COLORS[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
      <Text style={[styles.label, { color: colors.text }]}>
        {STATUS_MANUTENCAO_LABELS[status]}
      </Text>
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
