// src/app/_layout.tsx
//
// Layout raiz do expo-router: monta o AuthProvider e faz a proteção de rota
// (docs/cmms-backend-spec.md §5.3). Só as telas listadas em ROTAS_PUBLICAS
// abrem sem sessão; qualquer outra manda o usuário pro login.

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { ROUTES } from '@/constants/routes';

/** Nomes de arquivo em src/app/ que abrem sem estar logado. */
const ROTAS_PUBLICAS = ['login', 'cadUser', 'recuperarSenha', 'termos', 'privacidade'];

function RotasProtegidas() {
  const { isAuthenticated, isCarregando } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isCarregando) return;

    const rotaAtual = segments[0];
    const emRotaPublica = rotaAtual !== undefined && ROTAS_PUBLICAS.includes(rotaAtual);

    if (!isAuthenticated && !emRotaPublica) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    // Já logado não fica preso na tela de login (nem no index, que só redireciona).
    if (isAuthenticated && (rotaAtual === undefined || rotaAtual === 'login')) {
      router.replace(ROUTES.HOME);
    }
  }, [isAuthenticated, isCarregando, segments]);

  if (isCarregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RotasProtegidas />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
});
