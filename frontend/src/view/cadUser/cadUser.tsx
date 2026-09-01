import { useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "./cadUser.style";
import { ROUTES } from "@/constants/routes";
import { api, isApiConfigured } from "@/services/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN_LENGTH = 8;

type FormErrors = {
  username?: string;
  cargo?: string;
  empresa?: string;
  funcao?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
};

export default function CadUserScreen() {
  const [username, setUsername] = useState("");
  const [cargo, setCargo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [funcao, setFuncao] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!username.trim()) nextErrors.username = "Informe o nome de usuário.";
    if (!cargo.trim()) nextErrors.cargo = "Informe o cargo.";
    if (!empresa.trim()) nextErrors.empresa = "Informe a empresa.";
    if (!funcao.trim()) nextErrors.funcao = "Informe a função.";

    if (!email.trim()) {
      nextErrors.email = "Informe o e-mail.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Informe um e-mail válido.";
    }

    if (!senha) {
      nextErrors.senha = "Informe a senha.";
    } else if (senha.length < SENHA_MIN_LENGTH) {
      nextErrors.senha = `A senha deve ter ao menos ${SENHA_MIN_LENGTH} caracteres.`;
    }

    if (!confirmarSenha) {
      nextErrors.confirmarSenha = "Confirme a senha.";
    } else if (senha !== confirmarSenha) {
      nextErrors.confirmarSenha = "As senhas não coincidem.";
    }

    return nextErrors;
  };

  const handleCadastrar = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    setErroGeral(null);
    setSucesso(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setCarregando(true);

    try {
      if (isApiConfigured()) {
        // POST /auth/registrar cria o usuário com ativo = false;
        // um admin precisa aprovar antes do primeiro login.
        await api.post(
          "/auth/registrar",
          {
            username: username.trim(),
            cargo: cargo.trim(),
            empresa: empresa.trim(),
            funcao: funcao.trim(),
            email: email.trim(),
            senha,
          },
          { auth: false }
        );
      }

      setSucesso("Solicitação enviada, aguarde aprovação");
    } catch (e) {
      setErroGeral(
        e instanceof Error
          ? e.message
          : "Não foi possível enviar a solicitação. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  };

  const isFormFilled =
    username.trim() &&
    cargo.trim() &&
    empresa.trim() &&
    funcao.trim() &&
    email.trim() &&
    senha &&
    confirmarSenha;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logoText}>CMMS</Text>
            <Text style={styles.subtitle}>Cadastro de novo usuário</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeTitle}>Criar conta</Text>
            <Text style={styles.welcomeText}>
              Preencha os dados abaixo para solicitar acesso ao sistema.
            </Text>

            {/* Usuário */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nome de Usuário</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                value={username}
                onChangeText={setUsername}
                placeholder="Nome de Usuário"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!carregando}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            {/* Cargo */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Cargo</Text>
              <TextInput
                style={[styles.input, errors.cargo && styles.inputError]}
                value={cargo}
                onChangeText={setCargo}
                placeholder="Ex.: Técnico de Manutenção"
                placeholderTextColor="#94A3B8"
                editable={!carregando}
              />
              {errors.cargo && <Text style={styles.errorText}>{errors.cargo}</Text>}
            </View>

            {/* Empresa */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Empresa</Text>
              <TextInput
                style={[styles.input, errors.empresa && styles.inputError]}
                value={empresa}
                onChangeText={setEmpresa}
                placeholder="Nome da empresa"
                placeholderTextColor="#94A3B8"
                editable={!carregando}
              />
              {errors.empresa && (
                <Text style={styles.errorText}>{errors.empresa}</Text>
              )}
            </View>

            {/* Função */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Função</Text>
              <TextInput
                style={[styles.input, errors.funcao && styles.inputError]}
                value={funcao}
                onChangeText={setFuncao}
                placeholder="Ex.: Administrador, Técnico, Gestor"
                placeholderTextColor="#94A3B8"
                editable={!carregando}
              />
              {errors.funcao && <Text style={styles.errorText}>{errors.funcao}</Text>}
            </View>

            {/* E-mail */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={setEmail}
                placeholder="seuemail@empresa.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!carregando}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Senha */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Senha</Text>
              <View
                style={[
                  styles.passwordContainer,
                  errors.senha && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Crie uma senha"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!carregando}
                />
                <Pressable
                  style={styles.showPasswordButton}
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                  disabled={carregando}
                >
                  <Text style={styles.showPasswordText}>
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </Text>
                </Pressable>
              </View>
              {errors.senha && <Text style={styles.errorText}>{errors.senha}</Text>}
            </View>

            {/* Confirmar Senha */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View
                style={[
                  styles.passwordContainer,
                  errors.confirmarSenha && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="Repita a senha"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!mostrarConfirmarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!carregando}
                />
                <Pressable
                  style={styles.showPasswordButton}
                  onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  disabled={carregando}
                >
                  <Text style={styles.showPasswordText}>
                    {mostrarConfirmarSenha ? "Ocultar" : "Mostrar"}
                  </Text>
                </Pressable>
              </View>
              {errors.confirmarSenha && (
                <Text style={styles.errorText}>{errors.confirmarSenha}</Text>
              )}
            </View>

            {erroGeral && <Text style={styles.errorText}>{erroGeral}</Text>}
            {sucesso && <Text style={styles.successText}>{sucesso}</Text>}

            {/* Cadastrar */}
            <Pressable
              style={[
                styles.registerButton,
                (!isFormFilled || carregando) && styles.registerButtonDisabled,
              ]}
              onPress={handleCadastrar}
              disabled={!isFormFilled || carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Cadastrar</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.backButton}
              onPress={() => router.push(ROUTES.LOGIN)}
              disabled={carregando}
            >
              <Text style={styles.backButtonText}>Voltar para o login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}