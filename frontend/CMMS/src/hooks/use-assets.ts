// src/hooks/use-assets.ts

import { useEffect, useState } from 'react';

import { fetchAssets, fetchDashboardMetrics } from '@/services/assets-service';
import { Asset, DashboardMetric } from '@/types/assets';

type UseAssetsResult = {
  assets: Asset[];
  metrics: DashboardMetric[];
  isLoading: boolean;
  error: string | null;
};

export function useAssets(): UseAssetsResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [assetsData, metricsData] = await Promise.all([
          fetchAssets(),
          fetchDashboardMetrics(),
        ]);
        if (isMounted) {
          setAssets(assetsData);
          setMetrics(metricsData);
        }
      } catch {
        if (isMounted) setError('Não foi possível carregar os ativos.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { assets, metrics, isLoading, error };
}