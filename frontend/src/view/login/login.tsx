import { useState } from "react";
import { router } from "expo-router";
import { ROUTES } from "@/constants/routes";
import { styles } from "./login.style";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !senha.trim()) {
      return;
    }

    setCarregando(true);

    try {
      // const response = await api.post('/auth/login', {
      //   email,
      //   senha,
      // });

      console.log("Login:", {
        username,
        senha,
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleNotImplemented = (label: string) => {
    console.warn(`[login] Tela "${label}" ainda não implementada.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Logo / Identidade */}
          <View style={styles.header}>
            <Image
              source={require("../../../assets/images/CMMS_Logo.png")}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>CMMS</Text>

            <Text style={styles.subtitle}>
              Gestão de manutenção industrial e automotiva
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeTitle}>Bem-vindo</Text>
            <Text style={styles.welcomeText}>
              Entre com suas credenciais para acessar o sistema.
            </Text>
            {/* Usuário */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Usuário</Text>

              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Nome de Usuário"
                placeholderTextColor="#94A3B8"
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!carregando}
              />
            </View>
            {/* Senha */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Senha</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Digite sua senha"
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
            </View>

            <View style={styles.secondaryActions}>
              {/* Recuperar senha */}
              <Pressable
                style={styles.forgotButton}
                disabled={carregando}
                onPress={() => router.push(ROUTES.RECUPERAR_SENHA)}
              >
                <Text style={styles.forgotText}>Esqueci minha senha</Text>
              </Pressable>

              <Text style={styles.secondaryActionsSeparator}>●</Text>

              {/* Cadastrar Usuário */}
              {/*Somente gestores e administradores terão acesso ao cadastro*/}
              <Pressable
                style={styles.forgotButton}
                disabled={carregando}
                onPress={() => router.push(ROUTES.REGISTER_USER)}
              >
                <Text style={styles.forgotText}>Cadastre-se</Text>
              </Pressable>
            </View>

            {/* Entrar */}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                (!username.trim() || !senha.trim() || carregando) &&
                  styles.loginButtonDisabled,
                pressed && styles.loginButtonPressed,
              ]}
              onPress={handleLogin}
              disabled={!username.trim() || !senha.trim() || carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </Pressable>
          </View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <View style={styles.legalLinks}>
              <Pressable onPress={() => router.push(ROUTES.TERMS)}>
                <Text style={styles.legalLink}>Termos de Uso</Text>
              </Pressable>

              <Text style={styles.legalSeparator}>·</Text>

              <Pressable onPress={() => router.push(ROUTES.PRIVACY_POLICY)}>
                <Text style={styles.legalLink}>Política de Privacidade</Text>
              </Pressable>
            </View>
            <Text style={styles.footerText}>
              Sistema de Gestão de Manutenção
            </Text>
            <Text style={styles.footerVersion}>© 2026 CMMS · Versão 1.0.0</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
