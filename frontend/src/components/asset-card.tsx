// Card de cada ativo na listagem: nome, tipo+localização, status e data
// da última manutenção. Não sabe o que acontece ao ser clicado — só avisa
// o componente pai (Home) qual ativo foi tocado, via callback onPress.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ststus-badge';
import { TYPE_LABELS } from '@/constants/asset-status';
import { Asset } from '@/types/assets';

type AssetCardProps = {
  asset: Asset;
  onPress: (asset: Asset) => void;
};

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

export function AssetCard({ asset, onPress }: AssetCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(asset)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name} numberOfLines={1}>
          {asset.name}
        </Text>
        {asset.isMaintenanceOverdue && <View style={styles.overdueDot} />}
      </View>

      <Text style={styles.meta}>
        {TYPE_LABELS[asset.type]} · {asset.location}
      </Text>

      <StatusBadge status={asset.status} />

      <Text style={styles.lastMaintenance}>
        Última manutenção: {formatDate(asset.lastMaintenanceDate)}
      </Text>
    </Pressable>
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
    padding: 16,
    gap: 8,
  },
  cardPressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
  overdueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626', marginLeft: 8 },
  meta: { fontSize: 12, color: '#64748B' },
  lastMaintenance: { fontSize: 12, color: '#94A3B8' },
});