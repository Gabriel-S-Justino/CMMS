//home.tsx
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './home.style';
import { AssetCard } from '@/components/asset-card';
import { FilterChip } from '@/components/filter-chip';
import { MetricCard } from '@/components/metric-card';
import { useAssets } from '@/hooks/use-assets';
import { Asset, AssetStatus } from '@/types/assets';
import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';

type StatusFilter = AssetStatus | 'all';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'operational', label: 'Operacional' },
  { key: 'maintenance', label: 'Em manutenção' },
  { key: 'stopped', label: 'Parado' },
  { key: 'alert', label: 'Alerta' },
];

function handleNotImplemented() {
  console.warn('Tela ainda não implementada.');
}

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { assets, metrics, isLoading, error } = useAssets();

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      const matchesSearch = asset.name.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [assets, search, statusFilter]);

  const handleAssetPress = (asset: Asset) => {
    handleNotImplemented();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.logoText}>CMMS</Text>
            <Text style={styles.subtitle}>Painel de controle</Text>
          </View>
          <Pressable style={styles.profileButton} onPress={handleNotImplemented}>
            <Text style={styles.profileInitial}>U</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : (
          <>
            {/* metrics*/}
            <View style={styles.metricsGrid}>
              {metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ativos</Text>
                <Pressable style={styles.addButton}
                  onPress={() => router.push(ROUTES.REGISTER_ASSET as any)}
                >
                  <Text style={styles.addButtonText}>+ Novo ativo</Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar ativo por nome"
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

              {filteredAssets.length > 0 ? (
                <View style={styles.assetsGrid}>
                  {filteredAssets.map((asset) => (
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}