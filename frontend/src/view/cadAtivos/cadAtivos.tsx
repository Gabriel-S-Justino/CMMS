import { useMemo, useState } from 'react';
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
import { router } from 'expo-router';

import { styles } from './cadAtivos.style';
import { ROUTES } from '@/constants/routes';

type FormErrors = {
  nome?: string;
  categoria?: string;
  tipo?: string;
  fabricante?: string;
  modelo?: string;
  ano?: string;
  numeroSerie?: string;
  patrimonio?: string;
  placa?: string;
  renavam?: string;
  localizacao?: string;
  responsavel?: string;
};

type Categoria =
  | 'vehicle'
  | 'industrialMachine'
  | 'equipment'
  | 'electrical'
  | 'infrastructure'
  | 'other';

const CATEGORIAS = [
  { value: 'vehicle', label: 'Veículo' },
  { value: 'industrialMachine', label: 'Máquina industrial' },
  { value: 'equipment', label: 'Equipamento' },
  { value: 'electrical', label: 'Equipamento elétrico' },
  { value: 'infrastructure', label: 'Infraestrutura' },
  { value: 'other', label: 'Outro' },
];

const TIPOS_POR_CATEGORIA: Record<Categoria, string[]> = {
  vehicle: [
    'Carro',
    'Moto',
    'Caminhão',
    'Ônibus',
    'Van',
    'Empilhadeira',
    'Outro',
  ],
  industrialMachine: [
    'Torno',
    'Fresadora',
    'Prensa',
    'Compressor',
    'Gerador',
    'Esteira',
    'Outro',
  ],
  equipment: [
    'Ferramenta',
    'Equipamento mecânico',
    'Equipamento de medição',
    'Equipamento operacional',
    'Outro',
  ],
  electrical: [
    'Motor elétrico',
    'Painel elétrico',
    'Transformador',
    'Inversor',
    'Outro',
  ],
  infrastructure: [
    'Instalação',
    'Estrutura',
    'Sistema',
    'Outro',
  ],
  other: ['Outro'],
};

const STATUS_OPTIONS = [
  { value: 'operational', label: 'Operacional' },
  { value: 'maintenance', label: 'Em manutenção' },
  { value: 'stopped', label: 'Parado' },
  { value: 'alert', label: 'Alerta' },
];

export default function CadAtivosScreen() {
  const [etapa, setEtapa] = useState(1);

  // Identificação
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<Categoria | ''>('');
  const [tipo, setTipo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [patrimonio, setPatrimonio] = useState('');

  // Características
  const [fabricante, setFabricante] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');

  // Veículos
  const [placa, setPlaca] = useState('');
  const [renavam, setRenavam] = useState('');
  const [chassi, setChassi] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [horimetro, setHorimetro] = useState('');
  const [combustivel, setCombustivel] = useState('');

  // Máquinas / equipamentos
  const [potencia, setPotencia] = useState('');
  const [tensao, setTensao] = useState('');
  const [capacidade, setCapacidade] = useState('');

  // Operação
  const [localizacao, setLocalizacao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [status, setStatus] = useState('operational');

  // Aquisição
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [valorAquisicao, setValorAquisicao] = useState('');
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState('');
  const [garantia, setGarantia] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [carregando, setCarregando] = useState(false);

  const tiposDisponiveis = useMemo(() => {
    if (!categoria) return [];
    return TIPOS_POR_CATEGORIA[categoria];
  }, [categoria]);

  const isVeiculo = categoria === 'vehicle';

  const isMaquinaOuEquipamento =
    categoria === 'industrialMachine' ||
    categoria === 'equipment' ||
    categoria === 'electrical';

  const validateEtapa = () => {
    const nextErrors: FormErrors = {};

    if (etapa === 1) {
      if (!nome.trim()) {
        nextErrors.nome = 'Informe o nome do ativo.';
      }

      if (!categoria) {
        nextErrors.categoria = 'Selecione uma categoria.';
      }

      if (!tipo.trim()) {
        nextErrors.tipo = 'Selecione o tipo do ativo.';
      }
    }

    if (etapa === 2) {
      if (!fabricante.trim()) {
        nextErrors.fabricante = 'Informe o fabricante.';
      }

      if (!modelo.trim()) {
        nextErrors.modelo = 'Informe o modelo.';
      }

      if (!ano.trim()) {
        nextErrors.ano = 'Informe o ano.';
      } else if (
        Number(ano) < 1900 ||
        Number(ano) > new Date().getFullYear() + 1
      ) {
        nextErrors.ano = 'Informe um ano válido.';
      }
    }

    if (etapa === 3) {
      if (!localizacao.trim()) {
        nextErrors.localizacao = 'Informe a localização.';
      }

      if (!responsavel.trim()) {
        nextErrors.responsavel = 'Informe o responsável.';
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleProximo = () => {
    if (!validateEtapa()) return;

    setEtapa((current) => Math.min(current + 1, 4));
    setErrors({});
  };

  const handleVoltar = () => {
    if (etapa === 1) {
      router.back();
      return;
    }

    setEtapa((current) => current - 1);
    setErrors({});
  };

  const handleCadastrar = async () => {
    if (!validateEtapa()) return;

    setCarregando(true);

    try {
      /*
       * TODO:
       * Enviar os dados para o backend.
       *
       * A estrutura futura poderá ser:
       *
       * {
       *   identification: {...},
       *   technical: {...},
       *   operation: {...},
       *   acquisition: {...}
       * }
       */

      router.back();
    } finally {
      setCarregando(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    error?: string,
    options?: {
      keyboardType?: 'default' | 'numeric' | 'email-address';
      maxLength?: number;
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    },
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        editable={!carregando}
        keyboardType={options?.keyboardType ?? 'default'}
        maxLength={options?.maxLength}
        autoCapitalize={options?.autoCapitalize ?? 'sentences'}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderSelect = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onSelect: (value: string) => void,
    error?: string,
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.optionsContainer,
          error && styles.inputError,
        ]}
      >
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.optionButton,
              value === option.value && styles.optionButtonActive,
            ]}
            onPress={() => onSelect(option.value)}
            disabled={carregando}
          >
            <View
              style={[
                styles.radio,
                value === option.value && styles.radioActive,
              ]}
            />

            <Text
              style={[
                styles.optionText,
                value === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderEtapa1 = () => (
    <>
      <Text style={styles.sectionTitle}>Identificação</Text>

      <Text style={styles.sectionDescription}>
        Informe os dados básicos para identificar o ativo no sistema.
      </Text>

      {renderInput(
        'Nome do ativo',
        nome,
        setNome,
        'Ex.: Caminhão Volvo FH 540',
        errors.nome,
      )}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Categoria</Text>

        <View
          style={[
            styles.selectContainer,
            errors.categoria && styles.inputError,
          ]}
        >
          {CATEGORIAS.map((item) => (
            <Pressable
              key={item.value}
              style={[
                styles.selectButton,
                categoria === item.value && styles.selectButtonActive,
              ]}
              onPress={() => {
                setCategoria(item.value as Categoria);
                setTipo('');
              }}
              disabled={carregando}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  categoria === item.value &&
                    styles.selectButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {errors.categoria && (
          <Text style={styles.errorText}>{errors.categoria}</Text>
        )}
      </View>

      {categoria && (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Tipo de ativo</Text>

          <View
            style={[
              styles.selectContainer,
              errors.tipo && styles.inputError,
            ]}
          >
            {tiposDisponiveis.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.selectButton,
                  tipo === item && styles.selectButtonActive,
                ]}
                onPress={() => setTipo(item)}
                disabled={carregando}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    tipo === item &&
                      styles.selectButtonTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          {errors.tipo && (
            <Text style={styles.errorText}>{errors.tipo}</Text>
          )}
        </View>
      )}

      {renderInput(
        'Código do ativo',
        codigo,
        setCodigo,
        'Ex.: AT-000123',
        undefined,
        { autoCapitalize: 'characters' },
      )}

      {renderInput(
        'Número do patrimônio',
        patrimonio,
        setPatrimonio,
        'Ex.: PAT-001245',
        undefined,
        { autoCapitalize: 'characters' },
      )}
    </>
  );

  const renderEtapa2 = () => (
    <>
      <Text style={styles.sectionTitle}>Características</Text>

      <Text style={styles.sectionDescription}>
        Informe as características técnicas e os dados de identificação
        do equipamento.
      </Text>

      {renderInput(
        'Fabricante',
        fabricante,
        setFabricante,
        'Ex.: Volvo',
        errors.fabricante,
      )}

      {renderInput(
        'Modelo',
        modelo,
        setModelo,
        'Ex.: FH 540',
        errors.modelo,
      )}

      {renderInput(
        'Ano de fabricação',
        ano,
        setAno,
        'Ex.: 2025',
        errors.ano,
        {
          keyboardType: 'numeric',
          maxLength: 4,
        },
      )}

      {renderInput(
        'Número de série',
        numeroSerie,
        setNumeroSerie,
        'Número de série do fabricante',
        errors.numeroSerie,
      )}

      {isVeiculo && (
        <>
          <Text style={styles.subsectionTitle}>
            Dados do veículo
          </Text>

          {renderInput(
            'Placa',
            placa,
            setPlaca,
            'Ex.: ABC1D23',
            errors.placa,
            {
              autoCapitalize: 'characters',
            },
          )}

          {renderInput(
            'RENAVAM',
            renavam,
            setRenavam,
            'Número do RENAVAM',
            errors.renavam,
            {
              keyboardType: 'numeric',
            },
          )}

          {renderInput(
            'Chassi',
            chassi,
            setChassi,
            'Número do chassi',
            undefined,
            {
              autoCapitalize: 'characters',
            },
          )}

          {renderInput(
            'Quilometragem atual',
            quilometragem,
            setQuilometragem,
            'Ex.: 125430',
            undefined,
            {
              keyboardType: 'numeric',
            },
          )}

          {renderInput(
            'Horímetro',
            horimetro,
            setHorimetro,
            'Ex.: 3420',
            undefined,
            {
              keyboardType: 'numeric',
            },
          )}

          {renderInput(
            'Combustível',
            combustivel,
            setCombustivel,
            'Ex.: Diesel',
          )}
        </>
      )}

      {isMaquinaOuEquipamento && (
        <>
          <Text style={styles.subsectionTitle}>
            Dados técnicos
          </Text>

          {renderInput(
            'Potência',
            potencia,
            setPotencia,
            'Ex.: 15 kW',
          )}

          {renderInput(
            'Tensão',
            tensao,
            setTensao,
            'Ex.: 380 V',
          )}

          {renderInput(
            'Capacidade',
            capacidade,
            setCapacidade,
            'Ex.: 10 toneladas',
          )}
        </>
      )}
    </>
  );

  const renderEtapa3 = () => (
    <>
      <Text style={styles.sectionTitle}>Operação</Text>

      <Text style={styles.sectionDescription}>
        Defina onde o ativo está localizado, quem é o responsável e
        qual é o seu estado atual.
      </Text>

      {renderInput(
        'Localização',
        localizacao,
        setLocalizacao,
        'Ex.: Unidade Fortaleza',
        errors.localizacao,
      )}

      {renderInput(
        'Responsável',
        responsavel,
        setResponsavel,
        'Nome do responsável',
        errors.responsavel,
      )}

      {renderSelect(
        'Status',
        status,
        STATUS_OPTIONS,
        setStatus,
      )}

      <Text style={styles.subsectionTitle}>
        Informações operacionais
      </Text>

      <Text style={styles.infoText}>
        Os dados operacionais específicos do ativo poderão ser
        atualizados posteriormente conforme sua utilização e
        histórico de manutenção.
      </Text>
    </>
  );

  const renderEtapa4 = () => (
    <>
      <Text style={styles.sectionTitle}>
        Aquisição e informações adicionais
      </Text>

      <Text style={styles.sectionDescription}>
        Essas informações ajudam no controle financeiro, garantia e
        histórico do ativo.
      </Text>

      {renderInput(
        'Data de aquisição',
        dataAquisicao,
        setDataAquisicao,
        'Ex.: 15/03/2025',
      )}

      {renderInput(
        'Fornecedor',
        fornecedor,
        setFornecedor,
        'Nome do fornecedor',
      )}

      {renderInput(
        'Valor de aquisição',
        valorAquisicao,
        setValorAquisicao,
        'Ex.: R$ 150.000,00',
        undefined,
        {
          keyboardType: 'numeric',
        },
      )}

      {renderInput(
        'Número da nota fiscal',
        numeroNotaFiscal,
        setNumeroNotaFiscal,
        'Número da nota fiscal',
        undefined,
        {
          keyboardType: 'numeric',
        },
      )}

      {renderInput(
        'Garantia até',
        garantia,
        setGarantia,
        'Ex.: 15/03/2027',
      )}

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Observações</Text>

        <TextInput
          style={styles.textArea}
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Informações adicionais sobre o ativo"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          editable={!carregando}
        />
      </View>
    </>
  );

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
            <View>
              <Text style={styles.logoText}>CMMS</Text>

              <Text style={styles.subtitle}>
                Cadastro de ativo
              </Text>
            </View>

            <Text style={styles.stepCounter}>
              {etapa} de 4
            </Text>
          </View>

          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((item) => (
              <View
                key={item}
                style={[
                  styles.progressItem,
                  item <= etapa && styles.progressItemActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.formContainer}>
            {etapa === 1 && renderEtapa1()}
            {etapa === 2 && renderEtapa2()}
            {etapa === 3 && renderEtapa3()}
            {etapa === 4 && renderEtapa4()}

            <View style={styles.navigationButtons}>
              <Pressable
                style={styles.backButton}
                onPress={handleVoltar}
                disabled={carregando}
              >
                <Text style={styles.backButtonText}>
                  {etapa === 1 ? 'Cancelar' : 'Voltar'}
                </Text>
              </Pressable>

              {etapa < 4 ? (
                <Pressable
                  style={styles.nextButton}
                  onPress={handleProximo}
                  disabled={carregando}
                >
                  <Text style={styles.nextButtonText}>
                    Continuar
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[
                    styles.nextButton,
                    carregando && styles.buttonDisabled,
                  ]}
                  onPress={handleCadastrar}
                  disabled={carregando}
                >
                  {carregando ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.nextButtonText}>
                      Cadastrar ativo
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}