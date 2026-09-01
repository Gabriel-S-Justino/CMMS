// src/services/api.ts
//
// Wrapper único de `fetch` para falar com o backend (docs/cmms-backend-spec.md §4).
//
// Responsabilidades:
//  - montar a URL a partir de EXPO_PUBLIC_API_URL (ex.: http://localhost:8000/api/v1)
//  - injetar `Authorization: Bearer <accessToken>` em toda requisição autenticada
//  - em 401, tentar UMA vez POST /auth/refresh e repetir a requisição original
//  - se o refresh falhar, limpar a sessão e mandar o usuário pro login
//
// Este módulo NÃO importa o auth-context (seria dependência circular). Ele guarda
// os tokens em memória e o AuthProvider se registra aqui via `registerSessionHandlers`
// para persistir/apagar o refresh token no expo-secure-store.

import { router } from 'expo-router';

import { ROUTES } from '@/constants/routes';

export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? '';

/** Sem EXPO_PUBLIC_API_URL o app roda em modo mock (ver assets-service). */
export function isApiConfigured(): boolean {
  return API_URL.length > 0;
}

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// --- Sessão em memória -----------------------------------------------------
// O accessToken vive só aqui (memória). O refreshToken também é mantido aqui
// para o fluxo de renovação, mas quem o persiste é o auth-context, no secure store.

let tokens: SessionTokens | null = null;

type SessionHandlers = {
  /** Chamado quando o refresh gera um novo par de tokens (persistir no secure store). */
  onTokensRefreshed?: (tokens: SessionTokens) => void | Promise<void>;
  /** Chamado quando a sessão morreu de vez (limpar secure store e estado do contexto). */
  onSessionExpired?: () => void | Promise<void>;
};

let handlers: SessionHandlers = {};

export function registerSessionHandlers(next: SessionHandlers) {
  handlers = next;
}

export function setSessionTokens(next: SessionTokens | null) {
  tokens = next;
}

export function getSessionTokens(): SessionTokens | null {
  return tokens;
}

// --- Refresh ---------------------------------------------------------------

/** Uma única renovação em voo por vez: requisições paralelas que tomam 401 esperam a mesma promise. */
let refreshInFlight: Promise<SessionTokens | null> | null = null;

async function refreshTokens(): Promise<SessionTokens | null> {
  const refreshToken = tokens?.refreshToken;
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Partial<SessionTokens>;
  if (!data.accessToken || !data.refreshToken) return null;

  const next: SessionTokens = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };

  tokens = next;
  await handlers.onTokensRefreshed?.(next);

  return next;
}

function ensureRefresh(): Promise<SessionTokens | null> {
  refreshInFlight ??= refreshTokens()
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

/** Sessão perdida: zera tudo e volta pro login. */
async function expireSession() {
  tokens = null;
  await handlers.onSessionExpired?.();
  router.replace(ROUTES.LOGIN);
}

// --- Requisição ------------------------------------------------------------

export type RequestOptions = {
  /** Rotas públicas (/auth/login, /auth/registrar...) não mandam Bearer nem tentam refresh. */
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(status: number, data: unknown): string {
  if (data && typeof data === 'object') {
    const detail = (data as Record<string, unknown>).detail ?? (data as Record<string, unknown>).mensagem;
    if (typeof detail === 'string') return detail;
  }
  if (typeof data === 'string' && data.trim()) return data;
  return `Erro ${status} ao comunicar com o servidor.`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  if (!isApiConfigured()) {
    throw new ApiError(0, 'EXPO_PUBLIC_API_URL não configurada.', null);
  }

  const withAuth = options.auth ?? true;

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
    };

    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (withAuth && tokens?.accessToken) {
      headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
    });
  };

  let response = await send();

  // 401: tenta renovar UMA vez e repete a requisição original.
  if (response.status === 401 && withAuth && tokens?.refreshToken) {
    const renewed = await ensureRefresh();

    if (!renewed) {
      await expireSession();
      throw new ApiError(401, 'Sessão expirada. Faça login novamente.', null);
    }

    response = await send();

    if (response.status === 401) {
      await expireSession();
      throw new ApiError(401, 'Sessão expirada. Faça login novamente.', null);
    }
  }

  const data = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(response.status, data), data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};
