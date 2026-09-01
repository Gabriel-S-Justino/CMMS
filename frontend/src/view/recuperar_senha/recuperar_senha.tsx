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

import { styles } from "./recuperarSenha.style";
import { ROUTES } from "@/constants/routes";
import { api, isApiConfigured } from "@/services/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
  username?: string;
  email?: string;
};

export default function RecuperacaoSenhaScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [mensagem, setMensagem] = useState<string | null>(null);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!username.trim()) {
      nextErrors.username = "Informe o nome de usuário.";
    }

    if (!email.trim()) {
      nextErrors.email = "Informe o e-mail.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Informe um e-mail válido.";
    }

    return nextErrors;
  };

  const handleRecuperarSenha = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    setMensagem(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setCarregando(true);

    try {
      if (isApiConfigured()) {
        // O endpoint responde 200 mesmo se o e-mail não existir,
        // pra não revelar quais e-mails estão cadastrados.
        await api.post(
          "/auth/recuperar-senha",
          { email: email.trim() },
          { auth: false }
        );
      }
    } catch {
      // Idem: qualquer falha mostra a mesma mensagem neutra.
    } finally {
      setCarregando(false);
      setMensagem(
        "Se os dados estiverem corretos, enviamos um link de recuperação para o e-mail informado."
      );
    }
  };

  const isFormFilled =
    username.trim().length > 0 &&
    email.trim().length > 0;

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

            <Text style={styles.subtitle}>
              Recuperação de senha
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeTitle}>
              Recuperar senha
            </Text>

            <Text style={styles.welcomeText}>
              Informe seu nome de usuário e o e-mail cadastrado.
              Se os dados estiverem corretos, enviaremos um link
              para redefinir sua senha.
            </Text>

            {/* Usuário */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Nome de Usuário
              </Text>

              <TextInput
                style={[
                  styles.input,
                  errors.username && styles.inputError,
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder="Nome de Usuário"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!carregando}
              />

              {errors.username && (
                <Text style={styles.errorText}>
                  {errors.username}
                </Text>
              )}
            </View>

            {/* E-mail */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                E-mail
              </Text>

              <TextInput
                style={[
                  styles.input,
                  errors.email && styles.inputError,
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="seuemail@empresa.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!carregando}
              />

              {errors.email && (
                <Text style={styles.errorText}>
                  {errors.email}
                </Text>
              )}
            </View>

            {mensagem && <Text style={styles.successText}>{mensagem}</Text>}

            {/* Recuperar senha */}
            <Pressable
              style={[
                styles.recoveryButton,
                (!isFormFilled || carregando) &&
                  styles.recoveryButtonDisabled,
              ]}
              onPress={handleRecuperarSenha}
              disabled={!isFormFilled || carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.recoveryButtonText}>
                  Recuperar senha
                </Text>
              )}
            </Pressable>

            {/* Voltar */}
            <Pressable
              style={styles.backButton}
              onPress={() => router.push(ROUTES.LOGIN)}
              disabled={carregando}
            >
              <Text style={styles.backButtonText}>
                Voltar para o login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}