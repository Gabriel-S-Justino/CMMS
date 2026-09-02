// Card de cada ativo na listagem: nome, tipo+localização, status e data
// da última manutenção. Não sabe o que acontece ao ser clicado — só avisa
// o componente pai (Home) qual ativo foi tocado, via callback onPress.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/status-badge';
import { CATEGORY_LABELS } from '@/constants/asset-status';
import { Asset } from '@/types/assets';

type AssetCardProps = {
  asset: Asset;
  onPress: (asset: Asset) => void;
};

// A API devolve null quando o ativo ainda não tem nenhuma manutenção registrada.
function formatLastMaintenance(isoDate: string | null) {
  if (!isoDate) return 'Sem manutenção';

  return `Última manutenção: ${new Date(isoDate).toLocaleDateString('pt-BR')}`;
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
      </View>

      <Text style={styles.meta}>
        {CATEGORY_LABELS[asset.category]} · {asset.type} · {asset.location}
      </Text>

      <View style={styles.badgeRow}>
        <StatusBadge status={asset.status} />
        {/* `isMaintenanceOverdue` vem calculado do backend: existe plano ativo
            com proximaPrevista no passado. */}
        {asset.isMaintenanceOverdue && (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueText}>Manutenção vencida</Text>
          </View>
        )}
      </View>

      <Text style={styles.lastMaintenance}>
        {formatLastMaintenance(asset.lastMaintenanceDate)}
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
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  overdueBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
  },
  overdueText: { fontSize: 11, fontWeight: '700', color: '#B91C1C' },
  meta: { fontSize: 12, color: '#64748B' },
  lastMaintenance: { fontSize: 12, color: '#94A3B8' },
});