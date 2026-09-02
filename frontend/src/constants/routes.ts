// Rotas centralizadas. Os literais batem com os arquivos de src/app/ e são
// validados pelos typed routes do expo-router (app.json → experiments.typedRoutes).

export const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  TERMS: '/termos',
  PRIVACY_POLICY: '/privacidade',
  REGISTER_USER: '/cadUser',
  REGISTER_ASSET: '/cadAtivos',
  RECUPERAR_SENHA: '/recuperarSenha',
  ASSET_DETAIL: '/ativoDetalhe',
  MAINTENANCE_FORM: '/manutencao',
  MAINTENANCE_DETAIL: '/manutencaoDetalhe',
  PLAN_FORM: '/planoPreventiva',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

// --- Destinos com parâmetro -------------------------------------------------
// Helpers em vez de montar query string na mão: o `router.push` recebe o objeto
// { pathname, params } e o expo-router cuida do encoding.

export const assetDetailRoute = (ativoId: number | string) =>
  ({ pathname: ROUTES.ASSET_DETAIL, params: { id: String(ativoId) } }) as const;

/** cadAtivos sem `id` cria; com `id`, edita o ativo (PATCH). */
export const assetFormRoute = (ativoId?: number | string) =>
  ({
    pathname: ROUTES.REGISTER_ASSET,
    params: ativoId === undefined ? {} : { id: String(ativoId) },
  }) as const;

/** manutencao sem `manutencaoId` abre uma nova; com ele, edita a existente. */
export const maintenanceFormRoute = (
  ativoId: number | string,
  manutencaoId?: number | string,
) =>
  ({
    pathname: ROUTES.MAINTENANCE_FORM,
    params:
      manutencaoId === undefined
        ? { ativoId: String(ativoId) }
        : { ativoId: String(ativoId), id: String(manutencaoId) },
  }) as const;

export const maintenanceDetailRoute = (manutencaoId: number | string) =>
  ({ pathname: ROUTES.MAINTENANCE_DETAIL, params: { id: String(manutencaoId) } }) as const;

/** planoPreventiva sempre precisa do ativo; com `id`, edita o plano existente. */
export const planFormRoute = (ativoId: number | string, planoId?: number | string) =>
  ({
    pathname: ROUTES.PLAN_FORM,
    params:
      planoId === undefined
        ? { ativoId: String(ativoId) }
        : { ativoId: String(ativoId), id: String(planoId) },
  }) as const;
