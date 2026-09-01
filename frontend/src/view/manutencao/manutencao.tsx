//manutencao.tsx
//
// Abertura e edição de manutenção (POST /manutencoes e PATCH /manutencoes/{id}
// — spec §4). Recebe `ativoId` para abrir uma nova; com `id` também, edita a
// existente.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { styles } from './manutencao.style';
import { DateField } from '@/components/date-field';
import { EntityPicker } from '@/components/entity-picker';
import { TIPOS_MANUTENCAO, TIPO_MANUTENCAO_LABELS } from '@/constants/maintenance-status';
import { maintenanceDetailRoute } from '@/constants/routes';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/services/api';
import {
  createManutencao,
  fetchManutencao,
  updateManutencao,
} from '@/services/maintenance-service';
import { fetchPrestadores } from '@/services/providers-service';
import { TipoManutencao } from '@/types/maintenance';
import { Prestador } from '@/types/providers';
import { dataParaISO, isoParaData, numeroParaAPI, numeroParaCampo } from '@/utils/format';

type FormErrors = {
  tipo?: string;
  descricao?: string;
  dataServico?: string;
  horimetro?: string;
  custoMaoDeObra?: string;
};

export default function ManutencaoScreen() {
  const { ativoId: ativoIdParam, id } = useLocalSearchParams<{
    ativoId?: string;
    id?: string;
  }>();

  const ativoId = Number(ativoIdParam);
  const manutencaoId = id ? Number(id) : null;
  const editando = manutencaoId !== null;

  const { temPermissao } = useAuth();
  const podeVerCustos = temPermissao('custos.ver');

  const [tipo, setTipo] = useState<TipoManutencao>('corretiva');
  // `undefined` = o usuário ainda não mexeu no seletor, então vale o que veio
  // gravado. Depois que ele escolhe (inclusive "Nenhum"), a escolha manda.
  const [prestadorEscolhido, setPrestadorEscolhido] = useState<Prestador | null | undefined>(
    undefined,
  );
  const [descricao, setDescricao] = useState('');
  const [dataServico, setDataServico] = useState('');
  const [horimetro, setHorimetro] = useState('');
  const [custoMaoDeObra, setCustoMaoDeObra] = useState('');

  const [prestadorIdSalvo, setPrestadorIdSalvo] = useState<number | null>(null);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [carregandoPrestadores, setCarregandoPrestadores] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [aviso, setAviso] = useState<string | null>(null);

  // Prestadores alimentam o seletor; a lista é curta e vem inteira.
  useEffect(() => {
    let ativo = true;

    fetchPrestadores()
      .then((lista) => ativo && setPrestadores(lista))
      .catch(() => ativo && setPrestadores([]))
      .finally(() => ativo && setCarregandoPrestadores(false));

    return () => {
      ativo = false;
    };
  }, []);

  // Em modo edição, preenche o formulário com o que já está gravado.
  useEffect(() => {
    if (manutencaoId === null) return;
    let ativo = true;

    fetchManutencao(manutencaoId)
      .then((manutencao) => {
        if (!ativo) return;
        setTipo(manutencao.tipo);
        setDescricao(manutencao.descricao ?? '');
        setDataServico(isoParaData(manutencao.dataServico));
        setHorimetro(numeroParaCampo(manutencao.horimetroNoServico));
        setCustoMaoDeObra(numeroParaCampo(manutencao.custoMaoDeObra));
        setPrestadorIdSalvo(manutencao.prestadorId);
      })
      .catch((e) => {
        if (ativo) setAviso(e instanceof Error ? e.message : 'Não foi possível carregar.');
      })
      .finally(() => ativo && setCarregandoDados(false));

    return () => {
      ativo = false;
    };
  }, [manutencaoId]);

  // O prestador gravado só vira objeto quando a lista chega. É valor derivado,
  // não estado: calcular no render evita o efeito em cascata.
  const prestador = useMemo(() => {
    if (prestadorEscolhido !== undefined) return prestadorEscolhido;
    if (prestadorIdSalvo === null) return null;

    return prestadores.find((p) => p.id === prestadorIdSalvo) ?? null;
  }, [prestadorEscolhido, prestadorIdSalvo, prestadores]);

  const validar = useCallback((): FormErrors => {
    const proximos: FormErrors = {};

    if (!descricao.trim()) {
      proximos.descricao = 'Descreva o serviço a ser feito.';
    }

    if (dataServico && !dataParaISO(dataServico)) {
      proximos.dataServico = 'Informe uma data válida (dd/mm/aaaa).';
    }

    if (horimetro.trim() && numeroParaAPI(horimetro) === null) {
      proximos.horimetro = 'Informe um número válido.';
    }

    if (podeVerCustos && custoMaoDeObra.trim() && numeroParaAPI(custoMaoDeObra) === null) {
      proximos.custoMaoDeObra = 'Informe um valor válido.';
    }

    return proximos;
  }, [custoMaoDeObra, dataServico, descricao, horimetro, podeVerCustos]);

  const salvar = async () => {
    const proximos = validar();
    setErrors(proximos);
    setAviso(null);

    if (Object.keys(proximos).length > 0) return;

    setSalvando(true);

    const corpo = {
      tipo,
      prestadorId: prestador?.id ?? null,
      descricao: descricao.trim(),
      dataServico: dataServico ? dataParaISO(dataServico) : null,
      horimetroNoServico: horimetro.trim() ? numeroParaAPI(horimetro) : null,
      // Sem permissão de custo o campo nem aparece: não mandamos o valor,
      // para não zerar o que outra pessoa já lançou.
      ...(podeVerCustos
        ? { custoMaoDeObra: numeroParaAPI(custoMaoDeObra) ?? '0' }
        : {}),
    };

    try {
      if (editando && manutencaoId !== null) {
        await updateManutencao(manutencaoId, corpo);
        router.back();
        return;
      }

      const criada = await createManutencao({ ...corpo, ativoId });
      router.replace(maintenanceDetailRoute(criada.id));
    } catch (e) {
      setAviso(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  };

  if (carregandoDados || (editando && carregandoPrestadores)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  if (!editando && !Number.isFinite(ativoId)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.erroTexto}>Ativo não informado.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.voltar}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.voltar}>‹ Voltar</Text>
            </Pressable>
            <Text style={styles.logoText}>CMMS</Text>
            <Text style={styles.subtitle}>
              {editando ? 'Edição de manutenção' : 'Abertura de manutenção'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>
              {editando ? 'Editar manutenção' : 'Nova manutenção'}
            </Text>
            <Text style={styles.sectionDescription}>
              Registre o serviço. As peças usadas são lançadas depois, na tela de detalhe.
            </Text>

            {aviso ? (
              <View style={styles.avisoBox}>
                <Text style={styles.avisoTexto}>{aviso}</Text>
              </View>
            ) : null}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Tipo de manutenção</Text>
              <View style={styles.selectContainer}>
                {TIPOS_MANUTENCAO.map((opcao) => (
                  <Pressable
                    key={opcao}
                    style={[styles.selectButton, tipo === opcao && styles.selectButtonActive]}
                    onPress={() => setTipo(opcao)}
                    disabled={salvando}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        tipo === opcao && styles.selectButtonTextActive,
                      ]}
                    >
                      {TIPO_MANUTENCAO_LABELS[opcao]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <EntityPicker
              label="Prestador"
              placeholder="Selecionar prestador (opcional)"
              valorSelecionado={prestador?.nome ?? null}
              itens={prestadores}
              carregando={carregandoPrestadores}
              editable={!salvando}
              permiteLimpar
              chaveDe={(item) => item.id}
              tituloDe={(item) => item.nome}
              subtituloDe={(item) => item.cnpjCpf ?? (item.tipo === 'interno' ? 'Interno' : null)}
              onSelecionar={setPrestadorEscolhido}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.textArea, errors.descricao && styles.inputError]}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="O que precisa ser feito?"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!salvando}
              />
              {errors.descricao && <Text style={styles.errorText}>{errors.descricao}</Text>}
            </View>

            <DateField
              label="Data do serviço"
              value={dataServico}
              onChangeText={setDataServico}
              error={errors.dataServico}
              editable={!salvando}
              helper="Deixe em branco se ainda não estiver agendada."
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Horímetro no serviço</Text>
              <TextInput
                style={[styles.input, errors.horimetro && styles.inputError]}
                value={horimetro}
                onChangeText={setHorimetro}
                placeholder="Ex.: 512"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                editable={!salvando}
              />
              {errors.horimetro && <Text style={styles.errorText}>{errors.horimetro}</Text>}
            </View>

            {podeVerCustos && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Custo de mão de obra</Text>
                <TextInput
                  style={[styles.input, errors.custoMaoDeObra && styles.inputError]}
                  value={custoMaoDeObra}
                  onChangeText={setCustoMaoDeObra}
                  placeholder="Ex.: 180,00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  editable={!salvando}
                />
                {errors.custoMaoDeObra ? (
                  <Text style={styles.errorText}>{errors.custoMaoDeObra}</Text>
                ) : (
                  <Text style={styles.helperText}>
                    O custo das peças é somado pelo sistema conforme você as lança.
                  </Text>
                )}
              </View>
            )}

            <View style={styles.navigationButtons}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={salvando}
              >
                <Text style={styles.backButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.nextButton, salvando && styles.buttonDisabled]}
                onPress={salvar}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextButtonText}>
                    {editando ? 'Salvar alterações' : 'Abrir manutenção'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** O 403 desta rota é sempre a regra "funcionário só edita o que criou" (spec §2.3). */
function mensagemDeErro(e: unknown): string {
  if (e instanceof ApiError && e.status === 403) {
    return 'Você só pode editar manutenções que você mesmo abriu. Peça a um gerente para alterar esta.';
  }
  return e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.';
}
