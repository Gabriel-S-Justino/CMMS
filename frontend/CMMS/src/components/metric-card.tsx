// Card branco de métrica (número grande + label embaixo) usado na grade
// de métricas no topo da Home. Só exibe — não sabe de onde vem o dado.

import { StyleSheet, Text, View } from 'react-native';

import { DashboardMetric } from '@/types/assets';

type MetricCardProps = {
  metric: DashboardMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{metric.value}</Text>
      <Text style={styles.label}>{metric.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 4,
  },
  value: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  label: { fontSize: 13, color: '#64748B' },
});