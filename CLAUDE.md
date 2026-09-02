# CMMS — Guia para o Claude Code

Sistema de gestão de manutenção (CMMS) para ativos industriais e automotivos:
máquinas, veículos, equipamentos elétricos e infraestrutura.

## Regra número um

**Responda sempre em português.** Comentários de código, mensagens de commit,
textos de interface e conversa com o usuário — tudo em português.

## Regra número dois — multi-tenant

O sistema atende várias empresas no mesmo banco. **Toda query filtra por
`empresa_id` via `escopo_empresa`; nunca acesse `Ativo`/`Manutencao`/`Peca`/
`Prestador`/`PlanoPreventiva`/`Anexo` sem ela.**

```python
@router.get("/ativos")
def listar(
    usuario: Usuario = Depends(requer("ativos.ver")),
    empresa_id: int = Depends(escopo_empresa),   # obrigatório
): ...
```

- Carregar por id é sempre `obter_do_escopo(db, Modelo, id, empresa_id, ...)`.
- Referência cruzada (o `ativoId` de uma manutenção, o `pecaId` de um item)
  valida que o alvo é da mesma empresa — pelo mesmo helper.
- Registro de outra empresa responde **404, nunca 403**: um 403 confirmaria
  que aquele id existe em outro tenant.
- `escopo_empresa_admin` devolve `None` para o superadmin (vê tudo). Use só em
  `usuarios`, `auditoria` e `empresas`, onde isso é intencional.

Detalhes completos na seção 8 da spec.

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
docker-compose.yml                   # postgres + api (postgres SEM porta publicada)
docker-compose.override.example.yml  # receita do override local (versionada)
docker-compose.override.yml          # o override de verdade, fora do Git
.env.example                         # copie para .env
```

```bash
cp .env.example .env   # ajuste POSTGRES_PASSWORD, JWT_SECRET, ADMIN_PASSWORD, SUPERADMIN_PASSWORD
cp docker-compose.override.example.yml docker-compose.override.yml   # opcional: postgres no host
docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec api python -m seeds.perfis_permissoes   # imprime o código de convite da Demo
```

A imagem carrega o código copiado (`COPY . .`), então **`docker compose restart`
não recarrega alteração de código** — use `docker compose up -d --build api`.

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
utils/        # format.ts — conversões entre data/decimal da API e o que o usuário lê e digita
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
- `usuario.empresa` (`{id, nome}`) é o tenant da sessão. O cadastro em
  `cadUser.tsx` não pede o nome da empresa: pede o **código da empresa**
  (`codigoConvite`), que o admin fornece.
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
alembic/versions/   # 0001_schema_inicial (já multi-tenant)
app/
  main.py           # FastAPI, CORS, slowapi, /api/v1/health, include dos routers
  core/
    config.py       # Settings (pydantic-settings) lido do .env
    database.py     # engine, SessionLocal, Base, get_db
    security.py     # argon2, JWT HS256, tokens opacos (sha256)
    permissions.py  # usuario_logado + requer("<permissao>") / requer_qualquer(...)
    tenant.py       # escopo_empresa, escopo_empresa_admin, obter_do_escopo
    auditoria.py    # snapshot() e registrar() em logs_auditoria
    rate_limit.py   # limiter do slowapi
  models/           # tabelas SQLAlchemy (empresa, usuario, perfil, permissao, ativo,
                    # manutencao, plano_preventiva, prestador, peca, anexo,
                    # refresh_token, token_recuperacao, log_auditoria, enums)
  schemas/          # Pydantic (CamelModel) — auth, usuario, ativo, manutencao,
                    # plano, prestador, peca, anexo, dashboard, auditoria, common
  services/         # regra de negócio, sem FastAPI dentro
  routers/          # auth, empresas, usuarios, ativos, dashboard, manutencoes,
                    # planos, prestadores, pecas, anexos, auditoria
seeds/              # perfis_permissoes.py — empresas Plataforma/Demo, perfis,
                    # permissões, superadmin e admin inicial
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
  máquina de dev, copie o `docker-compose.override.example.yml`.
- **Isolamento entre empresas** é requisito de segurança, não conveniência: veja
  a "Regra número dois" no topo. Vazar dado de um tenant para outro é o pior bug
  que este sistema pode ter.
- **Superadmin** (`empresas.gerenciar` + `usuarios.gerenciar`) administra a
  plataforma e **não tem nenhuma permissão operacional** — `GET /ativos` como
  superadmin responde 403. Ele vive na empresa "Plataforma".
- **Código de convite** nunca vai para `logs_auditoria` (está em `CAMPOS_SENSIVEIS`)
  e só aparece em `GET /empresas/minha` para quem tem `usuarios.aprovar`.

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
| `ADMIN_USERNAME` / `ADMIN_EMAIL` | `admin` / `admin@cmms.local` | admin da empresa "Demo" |
| `ADMIN_PASSWORD` | — | **obrigatória, sem default**: a API não sobe sem ela |
| `SUPERADMIN_USERNAME` / `SUPERADMIN_EMAIL` | `superadmin` / `superadmin@cmms.local` | admin da plataforma |
| `SUPERADMIN_PASSWORD` | — | **obrigatória, sem default** |

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
