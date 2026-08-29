export const ROUTES = {
  LOGIN: "/login",
  TERMS: "/termos",
  PRIVACY_POLICY: "/privacidade",
  REGISTER_USER: "/cadUser",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];