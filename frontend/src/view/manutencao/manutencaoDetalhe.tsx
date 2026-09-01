//manutencaoDetalhe.tsx
//
// Detalhe da manutenção (GET /manutencoes/{id} — spec §4): status, peças usadas
// e as ações de Concluir/Cancelar. O custo total é sempre o que o backend
// devolve: quem soma peças + mão de obra é o `manutencao_service` de lá.

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { styles } from './manutencaoDetalhe.style';
import { EntityPicker } from '@/components/entity-picker';
import { MaintenanceStatusBadge } from '@/components/maintenance-status-badge';
import {
  STATUS_MANUTENCAO_LABELS,
  TIPO_MANUTENCAO_LABELS,
  TRANSICOES_PERMITIDAS,
} from '@/constants/maintenance-status';
import { maintenanceFormRoute } from '@/constants/routes';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/services/api';
import {
  adicionarPeca,
  alterarStatusManutencao,
  deleteManutencao,
  fetchManutencao,
  removerPeca,
} from '@/services/maintenance-service';
import { fetchPecas } from '@/services/parts-service';
import { fetchPrestadores } from '@/services/providers-service';
import { Manutencao } from '@/types/maintenance';
import { Peca } from '@/types/parts';
import { Prestador } from '@/types/providers';
import {
  formatarData,
  formatarDataHora,
  formatarMoeda,
  hojeISO,
  numeroParaAPI,
  numeroParaCampo,
} from '@/utils/format';

export default function ManutencaoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const manutencaoId = Number(id);

  const { temPermissao } = useAuth();
  const podeVerCustos = temPermissao('custos.ver');
  const podeEditar = temPermissao('manutencoes.editar');
  const podeExcluir = temPermissao('manutencoes.deletar');

  const [manutencao, setManutencao] = useState<Manutencao | null>(null);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Formulário de nova peça
  const [pecaSelecionada, setPecaSelecionada] = useState<Peca | null>(null);
  const [quantidade, setQuantidade] = useState('1');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [erroPeca, setErroPeca] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!Number.isFinite(manutencaoId)) {
      setErro('Manutenção não informada.');
      setCarregando(false);
      return;
    }

    try {
      setErro(null);
      setManutencao(await fetchManutencao(manutencaoId));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar a manutenção.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [manutencaoId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  // Prestadores e peças servem só para traduzir id em nome na tela.
  useEffect(() => {
    let ativo = true;

    Promise.all([fetchPrestadores(), fetchPecas()])
      .then(([listaPrestadores, listaPecas]) => {
        if (!ativo) return;
        setPrestadores(listaPrestadores);
        setPecas(listaPecas);
      })
      .catch(() => undefined);

    return () => {
      ativo = false;
    };
  }, []);

  const nomeDaPeca = (pecaId: number) =>
    pecas.find((p) => p.id === pecaId)?.nome ?? `Peça #${pecaId}`;

  // O custo unitário nasce preenchido com o cadastro da peça, mas continua editável:
  // o preço do dia pode ser outro, e é ele que fica congelado na manutenção.
  const escolherPeca = (peca: Peca | null) => {
    setPecaSelecionada(peca);
    setCustoUnitario(peca ? numeroParaCampo(peca.custoUnitarioAtual) : '');
  };

  const lancarPeca = async () => {
    setErroPeca(null);
    setAviso(null);

    if (!pecaSelecionada) {
      setErroPeca('Selecione uma peça.');
      return;
    }

    const quantidadeAPI = numeroParaAPI(quantidade);
    if (quantidadeAPI === null || Number(quantidadeAPI) <= 0) {
      setErroPeca('Informe uma quantidade maior que zero.');
      return;
    }

    const custoAPI = custoUnitario.trim() ? numeroParaAPI(custoUnitario) : null;
    if (custoUnitario.trim() && custoAPI === null) {
      setErroPeca('Informe um custo unitário válido.');
      return;
    }

    setSalvando(true);

    try {
      const atualizada = await adicionarPeca(manutencaoId, {
        pecaId: pecaSelecionada.id,
        quantidade: quantidadeAPI,
        custoUnitarioNaData: custoAPI,
      });
      setManutencao(atualizada);
      setPecaSelecionada(null);
      setQuantidade('1');
      setCustoUnitario('');
    } catch (e) {
      setAviso(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  };

  const tirarPeca = async (pecaId: number) => {
    setSalvando(true);
    setAviso(null);

    try {
      await removerPeca(manutencaoId, pecaId);
      await carregar();
    } catch (e) {
      setAviso(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  };

  const mudarStatus = async (novoStatus: 'concluida' | 'cancelada' | 'em_andamento') => {
    setSalvando(true);
    setAviso(null);

    try {
      // Concluir também carimba a data de conclusão, que o backend não preenche sozinho.
      const atualizada = await alterarStatusManutencao(
        manutencaoId,
        novoStatus,
        novoStatus === 'concluida' ? hojeISO() : undefined,
      );
      setManutencao(atualizada);
    } catch (e) {
      setAviso(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = () => {
    Alert.alert('Excluir manutenção', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: excluir },
    ]);
  };

  const excluir = async () => {
    setSalvando(true);
    setAviso(null);

    try {
      await deleteManutencao(manutencaoId);
      router.back();
    } catch (e) {
      setAviso(mensagemDeErro(e));
    } finally {
      setSalvando(false);
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

  if (erro || !manutencao) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.erroTexto}>{erro ?? 'Manutenção não encontrada.'}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.voltar}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const transicoes = TRANSICOES_PERMITIDAS[manutencao.status];
  const finalizada = transicoes.length === 0;
  const prestador = prestadores.find((p) => p.id === manutencao.prestadorId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregar();
            }}
          />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.voltar}>‹ Voltar</Text>
          </Pressable>

          <Text style={styles.titulo}>{TIPO_MANUTENCAO_LABELS[manutencao.tipo]}</Text>
          <Text style={styles.subtitulo}>
            Aberta em {formatarDataHora(manutencao.dataAbertura)}
          </Text>
          <MaintenanceStatusBadge status={manutencao.status} />
        </View>

        {aviso ? (
          <View style={styles.avisoBox}>
            <Text style={styles.avisoTexto}>{aviso}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Dados do serviço</Text>

          {manutencao.descricao ? (
            <Text style={styles.descricao}>{manutencao.descricao}</Text>
          ) : null}

          <Linha label="Prestador" valor={prestador?.nome ?? 'Não informado'} />
          <Linha label="Data do serviço" valor={formatarData(manutencao.dataServico)} />
          <Linha label="Conclusão" valor={formatarData(manutencao.dataConclusao)} />
          <Linha
            label="Horímetro"
            valor={manutencao.horimetroNoServico ?? 'Não informado'}
          />
          <Linha label="Status" valor={STATUS_MANUTENCAO_LABELS[manutencao.status]} />
        </View>

        {podeVerCustos && (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Custos</Text>
            <Linha label="Mão de obra" valor={formatarMoeda(manutencao.custoMaoDeObra)} />
            <Linha label="Peças" valor={formatarMoeda(manutencao.custoPecas)} />
            <View style={styles.divisor} />
            <View style={styles.linha}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValor}>{formatarMoeda(manutencao.custoTotal)}</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.secaoHeader}>
            <Text style={styles.cardTitulo}>Peças usadas</Text>
          </View>

          {manutencao.pecas.length === 0 ? (
            <Text style={styles.vazioTexto}>Nenhuma peça lançada nesta manutenção.</Text>
          ) : (
            manutencao.pecas.map((item) => (
              <View key={item.pecaId} style={styles.pecaLinha}>
                <View style={styles.pecaInfo}>
                  <Text style={styles.pecaNome}>{nomeDaPeca(item.pecaId)}</Text>
                  <Text style={styles.pecaMeta}>
                    {item.quantidade} ×{' '}
                    {podeVerCustos ? formatarMoeda(item.custoUnitarioNaData) : '—'}
                  </Text>
                </View>

                {podeVerCustos && (
                  <Text style={styles.pecaSubtotal}>
                    {formatarMoeda(Number(item.quantidade) * Number(item.custoUnitarioNaData))}
                  </Text>
                )}

                {podeEditar && !finalizada && (
                  <Pressable onPress={() => tirarPeca(item.pecaId)} disabled={salvando} hitSlop={8}>
                    <Text style={styles.removerTexto}>Remover</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}

          {podeEditar && !finalizada && (
            <View style={styles.formPeca}>
              <EntityPicker
                label="Adicionar peça"
                placeholder="Selecionar peça"
                valorSelecionado={pecaSelecionada?.nome ?? null}
                itens={pecas}
                editable={!salvando}
                chaveDe={(item) => item.id}
                tituloDe={(item) => item.nome}
                subtituloDe={(item) =>
                  [item.codigo, item.estoque ? `estoque: ${item.estoque}` : null]
                    .filter(Boolean)
                    .join(' · ') || null
                }
                onSelecionar={escolherPeca}
              />

              <View style={styles.linhaDupla}>
                <View style={[styles.fieldContainer, styles.metade]}>
                  <Text style={styles.label}>Quantidade</Text>
                  <TextInput
                    style={styles.input}
                    value={quantidade}
                    onChangeText={setQuantidade}
                    placeholder="1"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    editable={!salvando}
                  />
                </View>

                {podeVerCustos && (
                  <View style={[styles.fieldContainer, styles.metade]}>
                    <Text style={styles.label}>Custo unitário</Text>
                    <TextInput
                      style={styles.input}
                      value={custoUnitario}
                      onChangeText={setCustoUnitario}
                      placeholder="0,00"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      editable={!salvando}
                    />
                  </View>
                )}
              </View>

              {erroPeca ? (
                <Text style={styles.errorText}>{erroPeca}</Text>
              ) : (
                <Text style={styles.helperText}>
                  O custo vem do cadastro da peça e pode ser ajustado: é o valor do dia que fica
                  congelado aqui.
                </Text>
              )}

              <Pressable
                style={[styles.botaoPrimario, salvando && styles.botaoDesabilitado]}
                onPress={lancarPeca}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.botaoPrimarioTexto}>Lançar peça</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {!finalizada && (
          <View style={styles.acoes}>
            {transicoes.includes('em_andamento') && podeEditar && (
              <Pressable
                style={[styles.botaoSecundario, salvando && styles.botaoDesabilitado]}
                onPress={() => mudarStatus('em_andamento')}
                disabled={salvando}
              >
                <Text style={styles.botaoSecundarioTexto}>Iniciar</Text>
              </Pressable>
            )}

            {transicoes.includes('concluida') && podeEditar && (
              <Pressable
                style={[styles.botaoSucesso, salvando && styles.botaoDesabilitado]}
                onPress={() => mudarStatus('concluida')}
                disabled={salvando}
              >
                <Text style={styles.botaoSucessoTexto}>Concluir</Text>
              </Pressable>
            )}

            {transicoes.includes('cancelada') && podeEditar && (
              <Pressable
                style={[styles.botaoPerigo, salvando && styles.botaoDesabilitado]}
                onPress={() => mudarStatus('cancelada')}
                disabled={salvando}
              >
                <Text style={styles.botaoPerigoTexto}>Cancelar</Text>
              </Pressable>
            )}
          </View>
        )}

        {(podeEditar || podeExcluir) && (
          <View style={styles.acoes}>
            {podeEditar && (
              <Pressable
                style={styles.botaoSecundario}
                onPress={() =>
                  router.push(maintenanceFormRoute(manutencao.ativoId, manutencao.id))
                }
              >
                <Text style={styles.botaoSecundarioTexto}>Editar</Text>
              </Pressable>
            )}

            {podeExcluir && (
              <Pressable
                style={[styles.botaoPerigo, salvando && styles.botaoDesabilitado]}
                onPress={confirmarExclusao}
                disabled={salvando}
              >
                <Text style={styles.botaoPerigoTexto}>Excluir</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Linha({ label, valor }: { label: string; valor: string | null }) {
  if (!valor) return null;

  return (
    <View style={styles.linha}>
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={styles.linhaValor}>{valor}</Text>
    </View>
  );
}

/** O 403 destas rotas é sempre a regra "funcionário só edita o que criou" (spec §2.3). */
function mensagemDeErro(e: unknown): string {
  if (e instanceof ApiError && e.status === 403) {
    return 'Você só pode alterar manutenções que você mesmo abriu. Peça a um gerente para mexer nesta.';
  }
  return e instanceof Error ? e.message : 'Não foi possível concluir a ação. Tente novamente.';
}
