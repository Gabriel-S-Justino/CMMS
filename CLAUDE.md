# CMMS — Guia para o Claude Code

Sistema de gestão de manutenção (CMMS) para ativos industriais e automotivos:
máquinas, veículos, equipamentos elétricos e infraestrutura.

## Regra número um

**Responda sempre em português.** Comentários de código, mensagens de commit,
textos de interface e conversa com o usuário — tudo em português.

## Documentação

- `docs/cmms-backend-spec.md` — **a fonte da verdade**. Schema do banco, RBAC,
  endpoints tela a tela, estrutura de pastas do backend. Leia antes de mexer
  em contrato de API, tipo de dado ou permissão.
- `docs/cmms-arquitetura-v2.drawio` — diagrama da arquitetura.

## Estrutura do repositório

```
docs/        # spec do backend e diagramas
frontend/    # app Expo / React Native
backend/     # API FastAPI
docker-compose.yml           # postgres + api (postgres SEM porta publicada)
docker-compose.override.yml  # ajustes locais, fora do Git (publica o postgres)
.env.example                 # copie para .env
```

```bash
cp .env.example .env         # ajuste POSTGRES_PASSWORD, JWT_SECRET, ADMIN_PASSWORD
docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec api python -m seeds.perfis_permissoes
```

## Frontend (`frontend/`)

**Stack:** Expo SDK 57 · React Native 0.86 · React 19 · expo-router (typed routes,
React Compiler ligado) · TypeScript strict · expo-secure-store

Leia a documentação versionada do Expo em https://docs.expo.dev/versions/v57.0.0/
antes de escrever código — a API mudou bastante entre as versões.

### Convenções (respeite todas)

- **Rotas só re-exportam telas.** Um arquivo em `src/app/` é só
  `export { default } from "@/view/<tela>/<tela>";`. Nada de lógica ou JSX lá.
- **Telas ficam em `src/view/<dominio>/`**, com o estilo ao lado num arquivo
  `.style.ts` separado (`StyleSheet.create`). Nada de estilo inline no JSX.
- **Alias `@/`** aponta pra `src/` (e `@/assets/` pra `assets/`). Use sempre o
  alias, nunca `../../..`.
- Rotas centralizadas em `src/constants/routes.ts` (`ROUTES.HOME`, `ROUTES.LOGIN`...).
- Labels e cores por status/categoria ficam em `src/constants/asset-status.ts`.
  Nada de `if (status === 'operational')` espalhado por componente.

### Organização de `frontend/src/`

```
app/          # rotas do expo-router (só re-exports) + _layout.tsx (AuthProvider + guarda de rota)
view/         # telas de verdade, cada uma com seu .style.ts
components/   # componentes reutilizáveis (asset-card, status-badge, metric-card, filter-chip)
context/      # auth-context.tsx — sessão, permissões, login/logout
services/     # api.ts (wrapper de fetch) e assets-service.ts (dados de ativos)
hooks/        # use-assets, use-theme, use-color-scheme
types/        # contratos de dados (Asset, Categoria, AssetStatus, DashboardMetric)
constants/    # rotas, tema, labels e cores
data/         # mocks usados enquanto o backend não está no ar
```

### Autenticação e chamadas de API

- `src/services/api.ts` é o **único** lugar que chama `fetch` para o backend.
  Injeta `Authorization: Bearer`, e em 401 tenta `POST /auth/refresh` uma vez,
  repete a requisição e, se o refresh falhar, limpa a sessão e volta pro login.
- `src/context/auth-context.tsx` guarda o **accessToken só em memória** e o
  **refreshToken no expo-secure-store**. Nunca use AsyncStorage para token.
  Em web o secure-store não existe: o fallback em `localStorage` só vale com
  `__DEV__`; em produção web a sessão fica **exclusivamente em memória**.
- Permissões vêm do backend em `usuario.permissoes`; para esconder ação na UI use
  `temPermissao('ativos.criar')` — os códigos estão na tabela da seção 2.3 da spec.
- `EXPO_PUBLIC_API_URL` (ver `frontend/.env.example`) define a base da API, já com
  o prefixo `/api/v1`. **Sem ela o app roda em modo mock** e continua funcionando
  sem backend — mantenha esse fallback ao criar novos services.

### Comandos

```bash
cd frontend
npm start          # expo start
npm run android    # / npm run ios / npm run web
npx tsc --noEmit   # checagem de tipos
npx expo lint      # lint
```

## Backend (`backend/`)

**Stack:** Python 3.12 · FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL 16 ·
Docker Compose · pydantic-settings · argon2-cffi · python-jose · slowapi ·
python-multipart

Princípio da spec: **o backend fala a língua do front.** Os enums usam os mesmos
valores string que `frontend/src/types/assets.ts` usa (`operational | maintenance |
stopped | alert`, `vehicle | industrialMachine | equipment | electrical |
infrastructure | other`) e as respostas saem em **camelCase**
(`alias_generator=to_camel`), no mesmo formato dos tipos `Asset` e `DashboardMetric`
do front.

### Organização de `backend/`

```
alembic/versions/   # 0001_schema_inicial, 0002_bloqueio_por_tentativas
app/
  main.py           # FastAPI, CORS, slowapi, /api/v1/health, include dos routers
  core/
    config.py       # Settings (pydantic-settings) lido do .env
    database.py     # engine, SessionLocal, Base, get_db
    security.py     # argon2, JWT HS256, tokens opacos (sha256)
    permissions.py  # usuario_logado + requer("<permissao>")
    auditoria.py    # snapshot() e registrar() em logs_auditoria
    rate_limit.py   # limiter do slowapi
  models/           # tabelas SQLAlchemy (usuario, perfil, permissao, ativo,
                    # manutencao, plano_preventiva, prestador, peca, anexo,
                    # refresh_token, token_recuperacao, log_auditoria, enums)
  schemas/          # Pydantic (CamelModel) — auth, usuario, ativo, manutencao,
                    # plano, prestador, peca, anexo, dashboard, auditoria, common
  services/         # regra de negócio, sem FastAPI dentro
  routers/          # auth, usuarios, ativos, dashboard, manutencoes, planos,
                    # prestadores, pecas, anexos, auditoria
seeds/              # perfis_permissoes.py — perfis, permissões e admin inicial
uploads/            # volume dos anexos, fora do webroot
```

Espelha o front: `view → services → types` vira `routers → services → schemas`,
um módulo por domínio. Detalhes completos na seção 3 da spec.

### Segurança — pontos não negociáveis (seção 6 da spec)

- argon2 nas senhas, JWT HS256 de 15 min, refresh de 7 dias com hash no banco e
  rotação a cada uso.
- `Depends(requer("<permissao>"))` em toda rota, Pydantic em toda entrada, zero
  SQL com f-string, `.env` fora do Git, `logs_auditoria` em todo insert/update/delete.
- **Bloqueio de conta:** 5 senhas erradas seguidas bloqueiam o usuário por
  15 min (`usuarios.tentativas_falhas` e `usuarios.bloqueado_ate`). O login
  responde **HTTP 423**; um login bem-sucedido, ou uma redefinição de senha,
  zera o contador. Constantes em `auth_service.MAX_TENTATIVAS_FALHAS` e
  `BLOQUEIO_MINUTOS`.
- **Tempo constante no login:** username inexistente ainda passa por um argon2
  contra `auth_service._HASH_FANTASMA`, para não vazar quem está cadastrado.
- **IP da auditoria:** `auditoria.ip_do_request` usa **só** `request.client.host`.
  Nada de ler `X-Forwarded-For` na mão — quem trata isso é o uvicorn, rodando com
  `--proxy-headers` e confiando apenas nos proxies de `FORWARDED_ALLOW_IPS`.
- **Postgres sem porta publicada** no `docker-compose.yml`. Para DBeaver/psql na
  máquina de dev, use o `docker-compose.override.yml` (fora do Git).

### Variáveis de ambiente (`.env`, ver `.env.example`)

| Variável | Padrão | Observação |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_DB` | `cmms` | |
| `POSTGRES_PASSWORD` | — | obrigatória |
| `API_PORT` | `8080` | porta no host; o container escuta na 8000 |
| `JWT_SECRET` | — | obrigatória: `openssl rand -hex 32` |
| `DEBUG` | `false` | `true` libera `/docs` e `/redoc` |
| `CORS_ORIGINS` | `http://localhost:8081` | separadas por vírgula |
| `FORWARDED_ALLOW_IPS` | vazio | proxies confiáveis do uvicorn; nunca `*` na internet |
| `POSTGRES_HOST_PORT` | `5432` | só tem efeito com o `docker-compose.override.yml` |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` | `admin` / `admin@cmms.local` | usados pelo seed |
| `ADMIN_PASSWORD` | — | **obrigatória, sem default**: a API não sobe sem ela |

### Comandos

```bash
docker compose up -d --build                       # sobe postgres + api
docker compose exec api alembic upgrade head       # aplica as migrations
docker compose exec api alembic revision -m "..."  # nova migration
docker compose exec api python -m seeds.perfis_permissoes
docker compose logs -f api
```

## Domínio — vocabulário

| Front (inglês) | Backend / banco (português) |
|---|---|
| `Asset` | `ativos` |
| `category` / `Categoria` | `categoria` (enum `categoria_ativo`) |
| `type` | `tipo` (texto livre, vem de `TIPOS_POR_CATEGORIA`) |
| `status` | `status` (enum `status_ativo`) |
| — | `manutencoes`, `planos_preventiva`, `prestadores`, `pecas`, `anexos` |

Login é por **username**, não por e-mail. Cadastro público cria usuário com
`ativo = false`: um admin aprova e define o perfil (`admin | gerente |
funcionario | leitura`) depois.
