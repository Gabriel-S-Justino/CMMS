//home.tsx
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { styles } from './home.style';
import { AssetCard } from '@/components/asset-card';
import { FilterChip } from '@/components/filter-chip';
import { MetricCard } from '@/components/metric-card';
import { ROUTES, assetDetailRoute } from '@/constants/routes';
import { useAuth } from '@/context/auth-context';
import { useAssets } from '@/hooks/use-assets';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Asset, AssetStatus } from '@/types/assets';

type StatusFilter = AssetStatus | 'all';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'operational', label: 'Operacional' },
  { key: 'maintenance', label: 'Em manutenção' },
  { key: 'stopped', label: 'Parado' },
  { key: 'alert', label: 'Alerta' },
];

/** Uma requisição por pausa na digitação, não uma por tecla. */
const DEBOUNCE_BUSCA_MS = 400;

function handleNotImplemented() {
  console.warn('Tela ainda não implementada.');
}

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const buscaComDebounce = useDebouncedValue(search, DEBOUNCE_BUSCA_MS);

  // A filtragem é do servidor (?busca= e ?status=): a tela mostra o que veio.
  const { assets, metrics, isLoading, isRefreshing, error, refresh } = useAssets({
    busca: buscaComDebounce,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const { temPermissao } = useAuth();

  // Voltar do cadastro ou do detalhe pode ter mudado a lista. O primeiro foco é
  // pulado: o useAssets já carrega ao montar, e recarregar aqui daria duas
  // requisições na abertura do app.
  const primeiroFoco = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;
        return;
      }
      refresh();
    }, [refresh]),
  );

  const handleAssetPress = (asset: Asset) => {
    router.push(assetDetailRoute(asset.id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.logoText}>CMMS</Text>
            <Text style={styles.subtitle}>Painel de controle</Text>
          </View>
          <Pressable style={styles.profileButton} onPress={handleNotImplemented}>
            <Text style={styles.profileInitial}>U</Text>
          </Pressable>
        </View>

        {/* metrics*/}
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ativos</Text>
            {temPermissao('ativos.criar') && (
              <Pressable
                style={styles.addButton}
                onPress={() => router.push(ROUTES.REGISTER_ASSET)}
              >
                <Text style={styles.addButtonText}>+ Novo ativo</Text>
              </Pressable>
            )}
          </View>

          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nome, código, patrimônio ou local"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {STATUS_FILTERS.map((filter) => (
                <FilterChip
                  key={filter.key}
                  label={filter.label}
                  active={statusFilter === filter.key}
                  onPress={() => setStatusFilter(filter.key)}
                />
              ))}
            </View>
          </ScrollView>

          {isLoading ? (
            <ActivityIndicator style={styles.listLoading} color="#2563EB" />
          ) : error ? (
            <Text style={styles.emptyText}>{error}</Text>
          ) : assets.length > 0 ? (
            <View style={styles.assetsGrid}>
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onPress={handleAssetPress} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhum ativo encontrado</Text>
              <Text style={styles.emptyText}>
                Ajuste os filtros ou cadastre um novo ativo para começar.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
