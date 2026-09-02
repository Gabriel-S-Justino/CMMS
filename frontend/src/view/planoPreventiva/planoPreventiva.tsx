//planoPreventiva.tsx
//
// Cadastro e edição de plano preventivo (POST /planos, PATCH /planos/{id} e
// POST /planos/{id}/executar — spec §4).
//
// O backend tem um CHECK que exige EXATAMENTE um entre intervaloDias e
// intervaloHoras. Por isso o formulário usa um seletor "Por dias" / "Por horas"
// que mostra só um campo: assim é impossível montar um corpo que o banco recusa.

import { useEffect, useState } from 'react';
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

import { styles } from './planoPreventiva.style';
import { DateField } from '@/components/date-field';
import { createPlano, executarPlano, fetchPlano, updatePlano } from '@/services/plans-service';
import { PlanoPreventiva } from '@/types/plans';
import { dataParaISO, estaVencida, formatarData, isoParaData } from '@/utils/format';

type BaseIntervalo = 'dias' | 'horas';

type FormErrors = {
  descricao?: string;
  intervalo?: string;
  ultimaExecucao?: string;
};

export default function PlanoPreventivaScreen() {
  const { ativoId: ativoIdParam, id } = useLocalSearchParams<{
    ativoId?: string;
    id?: string;
  }>();

  const ativoId = Number(ativoIdParam);
  const planoId = id ? Number(id) : null;
  const editando = planoId !== null;

  const [descricao, setDescricao] = useState('');
  const [base, setBase] = useState<BaseIntervalo>('dias');
  const [intervalo, setIntervalo] = useState('');
  const [ultimaExecucao, setUltimaExecucao] = useState('');

  const [plano, setPlano] = useState<PlanoPreventiva | null>(null);
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [executando, setExecutando] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    if (planoId === null) return;
    let ativo = true;

    fetchPlano(planoId)
      .then((encontrado) => {
        if (!ativo) return;
        setPlano(encontrado);
        setDescricao(encontrado.descricao);
        setBase(encontrado.intervaloHoras ? 'horas' : 'dias');
        setIntervalo(
          String(encontrado.intervaloHoras ?? encontrado.intervaloDias ?? ''),
        );
        setUltimaExecucao(isoParaData(encontrado.ultimaExecucao));
      })
      .catch((e) => {
        if (ativo) setAviso(e instanceof Error ? e.message : 'Não foi possível carregar.');
      })
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [planoId]);

  const validar = (): FormErrors => {
    const proximos: FormErrors = {};

    if (!descricao.trim()) {
      proximos.descricao = 'Descreva o que o plano prevê.';
    }

    const numero = Number(intervalo.trim());
    if (!intervalo.trim()) {
      proximos.intervalo = `Informe o intervalo em ${base}.`;
    } else if (!Number.isInteger(numero) || numero <= 0) {
      proximos.intervalo = 'Informe um número inteiro maior que zero.';
    }

    if (ultimaExecucao && !dataParaISO(ultimaExecucao)) {
      proximos.ultimaExecucao = 'Informe uma data válida (dd/mm/aaaa).';
    }

    return proximos;
  };

  const salvar = async () => {
    const proximos = validar();
    setErrors(proximos);
    setAviso(null);
    setSucesso(null);

    if (Object.keys(proximos).length > 0) return;

    setSalvando(true);

    const numero = Number(intervalo.trim());
    // Exatamente um dos dois vai preenchido; o outro vai null.
    const corpo = {
      descricao: descricao.trim(),
      intervaloDias: base === 'dias' ? numero : null,
      intervaloHoras: base === 'horas' ? numero : null,
      ultimaExecucao: ultimaExecucao ? dataParaISO(ultimaExecucao) : null,
    };

    try {
      if (editando && planoId !== null) {
        await updatePlano(planoId, corpo);
      } else {
        await createPlano({ ...corpo, ativoId });
      }
      router.back();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não foi possível salvar o plano.');
    } finally {
      setSalvando(false);
    }
  };

  const registrarExecucao = async () => {
    if (planoId === null) return;

    setExecutando(true);
    setAviso(null);
    setSucesso(null);

    try {
      const atualizado = await executarPlano(planoId);
      setPlano(atualizado);
      setUltimaExecucao(isoParaData(atualizado.ultimaExecucao));
      setSucesso(
        atualizado.proximaPrevista
          ? `Execução registrada. Próxima prevista para ${formatarData(atualizado.proximaPrevista)}.`
          : 'Execução registrada. A próxima depende do horímetro do ativo.',
      );
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não foi possível registrar a execução.');
    } finally {
      setExecutando(false);
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

  const vencido = plano ? plano.ativo && estaVencida(plano.proximaPrevista) : false;

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
            <Text style={styles.subtitle}>Plano de manutenção preventiva</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>{editando ? 'Editar plano' : 'Novo plano'}</Text>
            <Text style={styles.sectionDescription}>
              O sistema usa o intervalo para calcular a próxima preventiva e avisar quando vencer.
            </Text>

            {aviso ? (
              <View style={styles.avisoBox}>
                <Text style={styles.avisoTexto}>{aviso}</Text>
              </View>
            ) : null}

            {sucesso ? (
              <View style={styles.sucessoBox}>
                <Text style={styles.sucessoTexto}>{sucesso}</Text>
              </View>
            ) : null}

            {plano && (
              <View style={[styles.card, vencido && styles.cardVencido]}>
                <Text style={styles.cardTitulo}>Situação</Text>

                <View style={styles.linha}>
                  <Text style={styles.linhaLabel}>Última execução</Text>
                  <Text style={styles.linhaValor}>{formatarData(plano.ultimaExecucao)}</Text>
                </View>

                <View style={styles.linha}>
                  <Text style={styles.linhaLabel}>Próxima prevista</Text>
                  <Text style={vencido ? styles.linhaValorVencida : styles.linhaValor}>
                    {plano.proximaPrevista
                      ? `${formatarData(plano.proximaPrevista)}${vencido ? ' · vencida' : ''}`
                      : 'Depende do horímetro'}
                  </Text>
                </View>

                <Pressable
                  style={[styles.botaoExecutar, executando && styles.buttonDisabled]}
                  onPress={registrarExecucao}
                  disabled={executando}
                >
                  {executando ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.botaoExecutarTexto}>Registrar execução</Text>
                  )}
                </Pressable>
              </View>
            )}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, errors.descricao && styles.inputError]}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Ex.: Troca de óleo e filtros"
                placeholderTextColor="#94A3B8"
                editable={!salvando}
              />
              {errors.descricao && <Text style={styles.errorText}>{errors.descricao}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Base do intervalo</Text>
              <View style={styles.selectContainer}>
                {(['dias', 'horas'] as BaseIntervalo[]).map((opcao) => (
                  <Pressable
                    key={opcao}
                    style={[styles.selectButton, base === opcao && styles.selectButtonActive]}
                    onPress={() => {
                      setBase(opcao);
                      setErrors((atuais) => ({ ...atuais, intervalo: undefined }));
                    }}
                    disabled={salvando}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        base === opcao && styles.selectButtonTextActive,
                      ]}
                    >
                      {opcao === 'dias' ? 'Por dias' : 'Por horas'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                {base === 'dias' ? 'Intervalo em dias' : 'Intervalo em horas'}
              </Text>
              <TextInput
                style={[styles.input, errors.intervalo && styles.inputError]}
                value={intervalo}
                onChangeText={(texto) => setIntervalo(texto.replace(/\D/g, ''))}
                placeholder={base === 'dias' ? 'Ex.: 90' : 'Ex.: 1000'}
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                editable={!salvando}
              />
              {errors.intervalo ? (
                <Text style={styles.errorText}>{errors.intervalo}</Text>
              ) : (
                <Text style={styles.helperText}>
                  {base === 'dias'
                    ? 'A próxima data é calculada a partir da última execução.'
                    : 'Planos por horas só ganham data prevista quando o horímetro é lançado.'}
                </Text>
              )}
            </View>

            <DateField
              label="Última execução"
              value={ultimaExecucao}
              onChangeText={setUltimaExecucao}
              error={errors.ultimaExecucao}
              editable={!salvando}
              helper="Opcional. Serve de ponto de partida para a primeira previsão."
            />

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
                    {editando ? 'Salvar alterações' : 'Criar plano'}
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
