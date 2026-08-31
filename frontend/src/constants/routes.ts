export const ROUTES = {
  HOME: '/home',
  LOGIN: "/login",
  TERMS: "/termos",
  PRIVACY_POLICY: "/privacidade",
  REGISTER_USER: "/cadUser",
  REGISTER_ASSET: "/cadAtivos",
  RECUPERAR_SENHA: "/recuperarSenha",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];