//ativoDetalhe.tsx
//
// Detalhe do ativo (GET /ativos/{id} — spec §4). Abre ao tocar num card da home.
// O endpoint já devolve as últimas manutenções e os planos embutidos, então as
// duas abas saem de uma requisição só.

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { styles } from './ativoDetalhe.style';
import { MaintenanceStatusBadge } from '@/components/maintenance-status-badge';
import { StatusBadge } from '@/components/status-badge';
import { CATEGORY_LABELS } from '@/constants/asset-status';
import { TIPO_MANUTENCAO_LABELS } from '@/constants/maintenance-status';
import {
  assetFormRoute,
  maintenanceDetailRoute,
  maintenanceFormRoute,
  planFormRoute,
} from '@/constants/routes';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/services/api';
import { deleteAsset, fetchAsset } from '@/services/assets-service';
import { AssetDetalhe } from '@/types/assets';
import { ManutencaoResumo } from '@/types/maintenance';
import { PlanoResumo } from '@/types/plans';
import { estaVencida, formatarData, formatarMoeda } from '@/utils/format';

type Aba = 'manutencoes' | 'planos';

export default function AtivoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const ativoId = Number(id);

  const { temPermissao } = useAuth();

  const [ativo, setAtivo] = useState<AssetDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [aba, setAba] = useState<Aba>('manutencoes');

  const carregar = useCallback(async () => {
    if (!Number.isFinite(ativoId)) {
      setErro('Ativo não informado.');
      setCarregando(false);
      return;
    }

    try {
      setErro(null);
      setAtivo(await fetchAsset(ativoId));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar o ativo.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [ativoId]);

  // Recarrega ao voltar de cadAtivos, manutenção ou plano — os dados mudaram lá.
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const aoAtualizar = useCallback(() => {
    setAtualizando(true);
    carregar();
  }, [carregar]);

  const confirmarExclusao = () => {
    Alert.alert(
      'Excluir ativo',
      `Excluir "${ativo?.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: excluir },
      ],
    );
  };

  const excluir = async () => {
    setExcluindo(true);
    setAviso(null);

    try {
      await deleteAsset(ativoId);
      router.back();
    } catch (e) {
      // 409 = o backend recusa apagar ativo que já tem manutenção registrada.
      const mensagem =
        e instanceof ApiError && e.status === 409
          ? e.message
          : 'Não foi possível excluir o ativo. Tente novamente.';
      setAviso(mensagem);
    } finally {
      setExcluindo(false);
    }
  };

  if (carregando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  if (erro || !ativo) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.erroTexto}>{erro ?? 'Ativo não encontrado.'}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.voltar}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.voltar}>‹ Voltar</Text>
          </Pressable>

          <Text style={styles.titulo}>{ativo.nome}</Text>
          <Text style={styles.subtitulo}>
            {CATEGORY_LABELS[ativo.categoria]}
            {ativo.tipo ? ` · ${ativo.tipo}` : ''}
            {ativo.localizacao ? ` · ${ativo.localizacao}` : ''}
          </Text>

          <View style={styles.badgeRow}>
            <StatusBadge status={ativo.status} />
            {ativo.manutencaoAtrasada && (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueText}>Manutenção vencida</Text>
              </View>
            )}
          </View>
        </View>

        {aviso ? (
          <View style={styles.avisoBox}>
            <Text style={styles.avisoTexto}>{aviso}</Text>
          </View>
        ) : null}

        {(temPermissao('ativos.editar') || temPermissao('ativos.deletar')) && (
          <View style={styles.acoes}>
            {temPermissao('ativos.editar') && (
              <Pressable
                style={styles.botaoPrimario}
                onPress={() => router.push(assetFormRoute(ativo.id))}
              >
                <Text style={styles.botaoPrimarioTexto}>Editar</Text>
              </Pressable>
            )}

            {temPermissao('ativos.deletar') && (
              <Pressable
                style={[styles.botaoPerigo, excluindo && styles.botaoDesabilitado]}
                onPress={confirmarExclusao}
                disabled={excluindo}
              >
                {excluindo ? (
                  <ActivityIndicator color="#B91C1C" />
                ) : (
                  <Text style={styles.botaoPerigoTexto}>Excluir</Text>
                )}
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Dados do ativo</Text>

          <Linha label="Código" valor={ativo.codigo} />
          <Linha label="Patrimônio" valor={ativo.patrimonio} />
          <Linha label="Fabricante" valor={ativo.fabricante} />
          <Linha label="Modelo" valor={ativo.modelo} />
          <Linha label="Ano" valor={ativo.ano ? String(ativo.ano) : null} />
          <Linha label="Nº de série" valor={ativo.numeroSerie} />
          <Linha label="Responsável" valor={ativo.responsavel} />
          <Linha label="Última manutenção" valor={formatarData(ativo.ultimaManutencao)} />

          {Object.entries(ativo.especificacoes ?? {}).map(([campo, valor]) => (
            <Linha key={campo} label={rotuloEspecificacao(campo)} valor={valor} />
          ))}
        </View>

        <View style={styles.abas}>
          <Pressable
            style={[styles.aba, aba === 'manutencoes' && styles.abaAtiva]}
            onPress={() => setAba('manutencoes')}
          >
            <Text style={[styles.abaTexto, aba === 'manutencoes' && styles.abaTextoAtivo]}>
              Manutenções ({ativo.manutencoes.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.aba, aba === 'planos' && styles.abaAtiva]}
            onPress={() => setAba('planos')}
          >
            <Text style={[styles.abaTexto, aba === 'planos' && styles.abaTextoAtivo]}>
              Planos ({ativo.planos.length})
            </Text>
          </Pressable>
        </View>

        {aba === 'manutencoes' ? (
          <AbaManutencoes
            manutencoes={ativo.manutencoes}
            podeCriar={temPermissao('manutencoes.criar')}
            podeVerCustos={temPermissao('custos.ver')}
            onNova={() => router.push(maintenanceFormRoute(ativo.id))}
            onAbrir={(manutencaoId) => router.push(maintenanceDetailRoute(manutencaoId))}
          />
        ) : (
          <AbaPlanos
            planos={ativo.planos}
            podeCriar={temPermissao('planos.criar')}
            onNovo={() => router.push(planFormRoute(ativo.id))}
            onAbrir={(planoId) => router.push(planFormRoute(ativo.id, planoId))}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Blocos ------------------------------------------------------------------

function Linha({ label, valor }: { label: string; valor: string | null | undefined }) {
  if (!valor) return null;

  return (
    <View style={styles.linha}>
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={styles.linhaValor}>{valor}</Text>
    </View>
  );
}

function AbaManutencoes({
  manutencoes,
  podeCriar,
  podeVerCustos,
  onNova,
  onAbrir,
}: {
  manutencoes: ManutencaoResumo[];
  podeCriar: boolean;
  podeVerCustos: boolean;
  onNova: () => void;
  onAbrir: (id: number) => void;
}) {
  return (
    <View style={styles.secao}>
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>Últimas manutenções</Text>
        {podeCriar && (
          <Pressable style={styles.addButton} onPress={onNova}>
            <Text style={styles.addButtonText}>+ Nova manutenção</Text>
          </Pressable>
        )}
      </View>

      {manutencoes.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioTitulo}>Nenhuma manutenção registrada</Text>
          <Text style={styles.vazioTexto}>
            As manutenções deste ativo aparecerão aqui, da mais recente para a mais antiga.
          </Text>
        </View>
      ) : (
        manutencoes.map((manutencao) => (
          <Pressable
            key={manutencao.id}
            style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
            onPress={() => onAbrir(manutencao.id)}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitulo} numberOfLines={1}>
                {TIPO_MANUTENCAO_LABELS[manutencao.tipo]}
              </Text>
              <MaintenanceStatusBadge status={manutencao.status} />
            </View>

            {manutencao.descricao ? (
              <Text style={styles.itemMeta} numberOfLines={2}>
                {manutencao.descricao}
              </Text>
            ) : null}

            <Text style={styles.itemMeta}>
              Serviço: {formatarData(manutencao.dataServico)}
            </Text>

            {podeVerCustos && (
              <Text style={styles.itemCusto}>{formatarMoeda(manutencao.custoTotal)}</Text>
            )}
          </Pressable>
        ))
      )}
    </View>
  );
}

function AbaPlanos({
  planos,
  podeCriar,
  onNovo,
  onAbrir,
}: {
  planos: PlanoResumo[];
  podeCriar: boolean;
  onNovo: () => void;
  onAbrir: (id: number) => void;
}) {
  return (
    <View style={styles.secao}>
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>Planos preventivos</Text>
        {podeCriar && (
          <Pressable style={styles.addButton} onPress={onNovo}>
            <Text style={styles.addButtonText}>+ Novo plano</Text>
          </Pressable>
        )}
      </View>

      {planos.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioTitulo}>Nenhum plano preventivo</Text>
          <Text style={styles.vazioTexto}>
            Cadastre um plano para o sistema avisar quando a próxima preventiva vencer.
          </Text>
        </View>
      ) : (
        planos.map((plano) => {
          const vencido = plano.ativo && estaVencida(plano.proximaPrevista);

          return (
            <Pressable
              key={plano.id}
              style={({ pressed }) => [
                styles.itemCard,
                vencido && styles.itemCardVencido,
                pressed && styles.itemCardPressed,
              ]}
              onPress={() => onAbrir(plano.id)}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitulo} numberOfLines={2}>
                  {plano.descricao}
                </Text>
              </View>

              <Text style={styles.itemMeta}>{descreverIntervalo(plano)}</Text>

              <Text style={vencido ? styles.itemMetaVencida : styles.itemMeta}>
                {plano.proximaPrevista
                  ? `Próxima: ${formatarData(plano.proximaPrevista)}${vencido ? ' · vencida' : ''}`
                  : 'Próxima: depende do horímetro'}
              </Text>

              {!plano.ativo && <Text style={styles.itemMeta}>Plano inativo</Text>}
            </Pressable>
          );
        })
      )}
    </View>
  );
}

// --- Auxiliares --------------------------------------------------------------

function descreverIntervalo(plano: PlanoResumo): string {
  if (plano.intervaloDias) return `A cada ${plano.intervaloDias} dia(s)`;
  if (plano.intervaloHoras) return `A cada ${plano.intervaloHoras} hora(s)`;
  return 'Sem intervalo definido';
}

const ROTULOS_ESPECIFICACAO: Record<string, string> = {
  placa: 'Placa',
  renavam: 'RENAVAM',
  chassi: 'Chassi',
  combustivel: 'Combustível',
  potencia: 'Potência',
  tensao: 'Tensão',
  capacidade: 'Capacidade',
};

function rotuloEspecificacao(campo: string): string {
  return ROTULOS_ESPECIFICACAO[campo] ?? campo;
}
