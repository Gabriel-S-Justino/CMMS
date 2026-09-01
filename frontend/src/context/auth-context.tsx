// src/context/auth-context.tsx
//
// Estado de autenticação do app (docs/cmms-backend-spec.md §4 e §5).
//
// Regra de armazenamento:
//  - accessToken: SÓ em memória (some ao fechar o app; é curto, 15 min)
//  - refreshToken: expo-secure-store (Keychain/Keystore). Nunca AsyncStorage.
//
// Em web o expo-secure-store não tem implementação nativa. Lá caímos em
// localStorage APENAS em desenvolvimento (__DEV__), para não ter que refazer
// login a cada reload do Metro. Em produção web nada é persistido: a sessão
// vive só em memória e morre ao recarregar a aba — localStorage é legível por
// qualquer XSS, e um refresh token de 7 dias ali é um alvo grande demais.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
  ApiError,
  api,
  getSessionTokens,
  isApiConfigured,
  registerSessionHandlers,
  setSessionTokens,
  type SessionTokens,
} from '@/services/api';

const REFRESH_TOKEN_KEY = 'cmms.refreshToken';

export type Empresa = {
  id: number | string;
  nome: string;
};

export type Usuario = {
  id: number | string;
  username: string;
  perfil: string | null;
  permissoes: string[];
  /** Tenant do usuário: todo dado que ele vê pertence a esta empresa. */
  empresa: Empresa;
};

type LoginResponse = SessionTokens & {
  usuario: Usuario;
};

type AuthContextValue = {
  usuario: Usuario | null;
  permissoes: string[];
  isAuthenticated: boolean;
  /** true enquanto a sessão salva no secure store ainda está sendo restaurada. */
  isCarregando: boolean;
  temPermissao: (codigo: string) => boolean;
  login: (username: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// --- Secure store ----------------------------------------------------------

/** Web só persiste em dev; em produção a sessão fica exclusivamente em memória. */
const persisteNaWeb = Platform.OS === 'web' && __DEV__;

const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (!persisteNaWeb) return null;
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (!persisteNaWeb) return;
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* modo privado / storage bloqueado: segue só com a sessão em memória */
      }
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Limpa mesmo com a persistência desligada: pode haver sobra de um build
      // anterior de dev na mesma origem.
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* nada a limpar */
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// --- Provider --------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isCarregando, setIsCarregando] = useState(true);

  // Estável (deps vazias): pode ser usada direto pelo api.ts, que roda fora do ciclo do React.
  const limparSessao = useCallback(async () => {
    setSessionTokens(null);
    setUsuario(null);
    await secureStorage.remove(REFRESH_TOKEN_KEY);
  }, []);

  // Liga o api.ts na persistência: ele renova os tokens, nós gravamos o novo refresh.
  useEffect(() => {
    registerSessionHandlers({
      onTokensRefreshed: async (tokens) => {
        await secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
      },
      onSessionExpired: limparSessao,
    });
  }, [limparSessao]);

  // Restaura a sessão no boot: com o refresh token salvo, pega um access novo e o /auth/me.
  useEffect(() => {
    let ativo = true;

    async function restaurar() {
      try {
        if (!isApiConfigured()) return;

        const refreshToken = await secureStorage.get(REFRESH_TOKEN_KEY);
        if (!refreshToken) return;

        // accessToken vazio: o primeiro 401 dispara o refresh automático do api.ts.
        setSessionTokens({ accessToken: '', refreshToken });

        const me = await api.get<Usuario>('/auth/me');
        if (ativo) setUsuario(me);
      } catch {
        await limparSessao();
      } finally {
        if (ativo) setIsCarregando(false);
      }
    }

    restaurar();
    return () => {
      ativo = false;
    };
  }, [limparSessao]);

  const login = useCallback(async (username: string, senha: string) => {
    if (!isApiConfigured()) {
      throw new ApiError(0, 'API não configurada. Defina EXPO_PUBLIC_API_URL.', null);
    }

    const resposta = await api.post<LoginResponse>(
      '/auth/login',
      { username, senha },
      { auth: false },
    );

    setSessionTokens({
      accessToken: resposta.accessToken,
      refreshToken: resposta.refreshToken,
    });
    await secureStorage.set(REFRESH_TOKEN_KEY, resposta.refreshToken);
    setUsuario(resposta.usuario);
  }, []);

  const logout = useCallback(async () => {
    // Memória primeiro: em produção web o storage não guarda nada, mas o token
    // vivo está no api.ts e o servidor ainda precisa revogá-lo.
    const refreshToken =
      getSessionTokens()?.refreshToken ?? (await secureStorage.get(REFRESH_TOKEN_KEY));

    try {
      if (isApiConfigured() && refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Servidor fora do ar não pode impedir o usuário de sair: limpamos local mesmo assim.
    } finally {
      await limparSessao();
    }
  }, [limparSessao]);

  const permissoes = useMemo(() => usuario?.permissoes ?? [], [usuario]);

  const temPermissao = useCallback(
    (codigo: string) => permissoes.includes(codigo),
    [permissoes],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      permissoes,
      isAuthenticated: usuario !== null,
      isCarregando,
      temPermissao,
      login,
      logout,
    }),
    [usuario, permissoes, isCarregando, temPermissao, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  }

  return context;
}
