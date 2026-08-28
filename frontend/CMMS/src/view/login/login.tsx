import { useState } from 'react';
import { styles } from './login.style';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !senha.trim()) {
      return;
    }

    setCarregando(true);

    try {
      // Futuramente:
      // const response = await api.post('/auth/login', {
      //   email,
      //   senha,
      // });

      console.log('Login:', {
        username,
        senha,
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>

          {/* Logo / Identidade */}
          <View style={styles.header}>
            <Text style={styles.logoText}>CMMS</Text>

            <Text style={styles.subtitle}>
              Gestão de manutenção
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeTitle}>
              Bem-vindo
            </Text>

            <Text style={styles.welcomeText}>
              Entre com suas credenciais para acessar o sistema.
            </Text>

            {/* Usuário */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Usuário
              </Text>

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
              <Text style={styles.label}>
                Senha
              </Text>

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
                    {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Recuperar senha */}
            <Pressable
              style={styles.forgotButton}
              disabled={carregando}
            >
              <Text style={styles.forgotText}>
                Esqueci minha senha
              </Text>
            </Pressable>

            {/* Entrar */}
            <Pressable
              style={[
                styles.loginButton,
                (!username.trim() || !senha.trim() || carregando) &&
                  styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!username.trim() || !senha.trim() || carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  Entrar
                </Text>
              )}
            </Pressable>
          </View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Sistema de Gestão de Manutenção
            </Text>

            <Text style={styles.footerVersion}>
              Todos os direitos reservadors © 2026 - Versão 1.0.0
            </Text>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}