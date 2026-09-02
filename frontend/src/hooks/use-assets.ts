// src/hooks/use-assets.ts
//
// Carrega a lista de ativos e as métricas da home. Os filtros de busca e status
// vão para a API (?busca= e ?status=), não são aplicados no cliente: com muitos
// ativos, filtrar aqui exigiria baixar a base inteira a cada tecla.

import { useCallback, useEffect, useState } from 'react';

import { AssetFilters, fetchAssets, fetchDashboardMetrics } from '@/services/assets-service';
import { Asset, DashboardMetric } from '@/types/assets';

type UseAssetsResult = {
  assets: Asset[];
  metrics: DashboardMetric[];
  isLoading: boolean;
  /** true durante o "puxar para atualizar" — a lista antiga continua na tela. */
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
};

export function useAssets(filtros?: AssetFilters): UseAssetsResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Incrementado pelo refresh: é o que faz o efeito rodar de novo com os
  // mesmos filtros.
  const [recarga, setRecarga] = useState(0);

  const busca = filtros?.busca ?? '';
  const status = filtros?.status;

  useEffect(() => {
    // Cada carga aborta a anterior: digitar rápido não deixa uma resposta
    // antiga chegar depois e sobrescrever a nova.
    const controller = new AbortController();

    async function carregar() {
      try {
        const [assetsData, metricsData] = await Promise.all([
          fetchAssets({ busca, status }, { signal: controller.signal }),
          fetchDashboardMetrics({ signal: controller.signal }),
        ]);

        if (controller.signal.aborted) return;

        setAssets(assetsData);
        setMetrics(metricsData);
        setError(null);
      } catch (e) {
        // Requisição cancelada não é erro para o usuário: outra já está em voo.
        if (controller.signal.aborted || (e as Error)?.name === 'AbortError') return;
        setError('Não foi possível carregar os ativos.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    carregar();

    return () => controller.abort();
  }, [busca, status, recarga]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRecarga((atual) => atual + 1);
  }, []);

  return { assets, metrics, isLoading, isRefreshing, error, refresh };
}
