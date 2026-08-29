export const ROUTES = {
  LOGIN: "/login",
  TERMS: "/termos",
  PRIVACY_POLICY: "/privacidade",
  REGISTER_USER: "/cadUser",
  RECUPERAR_SENHA: "/recuperarSenha",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];