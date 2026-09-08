# CMMS — Computerized Maintenance Management System

Sistema de gestão de manutenção para ativos industriais e automotivos —
máquinas, veículos, equipamentos elétricos e infraestrutura — com **multi-tenant
nativo**, **RBAC granular** e trilha de auditoria completa.

> Stack: **FastAPI + SQLAlchemy 2 + PostgreSQL 16** no backend, **Expo Router +
> React Native + TypeScript** no frontend, orquestrados via **Docker Compose**.

---

## Sumário

- [Visão geral](#visão-geral)
- [Principais funcionalidades](#principais-funcionalidades)
- [Arquitetura](#arquitetura)
- [Stack tecnológica](#stack-tecnológica)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Modelo de domínio](#modelo-de-domínio)
- [Multi-tenant](#multi-tenant)
- [Segurança](#segurança)
- [API — endpoints](#api--endpoints)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Roadmap](#roadmap)
- [Escalabilidade — próximos passos de arquitetura](#escalabilidade--próximos-passos-de-arquitetura)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## Visão geral

O CMMS centraliza o ciclo de vida de manutenção de ativos físicos para
múltiplas empresas (**multi-tenant por coluna**, um único banco de dados
compartilhado). Cada empresa cadastra seus ativos, abre e acompanha ordens de
manutenção (preventiva, corretiva e preditiva), define planos de manutenção
preventiva recorrentes, controla peças e estoque, gerencia prestadores de
serviço (internos e externos) e anexa evidências (fotos, notas fiscais,
laudos, orçamentos) a cada registro — tudo com controle de acesso por perfil
(RBAC) e auditoria de toda alteração sensível.

O projeto é construído com um princípio explícito de **contrato compartilhado
entre front e back**: os enums do banco usam exatamente os mesmos valores de
string que os tipos TypeScript do frontend (`operational | maintenance |
stopped | alert`, `vehicle | industrialMachine | equipment | electrical |
infrastructure | other` etc.), e a API responde em `camelCase` no mesmo
formato dos tipos consumidos pelas telas — eliminando uma camada inteira de
tradução/adaptação entre camadas.

---

## Principais funcionalidades

### Gestão de ativos
- Cadastro completo (identificação, características técnicas, dados de
  aquisição, localização, responsável) com campos específicos por categoria
  (placa/renavam/chassi para veículos; potência/tensão/capacidade para
  máquinas) armazenados em uma coluna `JSONB` (`especificacoes`), evitando uma
  explosão de colunas nulas por categoria.
- Cálculo automático de última manutenção (`MAX(manutencoes.data_servico)`) e
  de manutenção vencida (existência de plano preventivo ativo com
  `proxima_prevista < hoje`), sem replicar esse estado em colunas
  desnormalizadas.
- Busca, filtro por status/categoria/localização e paginação.

### Ordens de manutenção
- Tipos: preventiva, corretiva, preditiva. Status: aberta, em andamento,
  concluída, cancelada.
- Vínculo de peças utilizadas por ordem (`manutencao_pecas`), com o custo
  unitário **congelado no momento do uso** — alterações futuras no preço da
  peça não reescrevem o histórico financeiro de ordens já fechadas.
- Custo total calculado a partir de mão de obra + soma das peças aplicadas.
- Regra de negócio de autorização granular: o perfil `funcionario` só edita
  ordens que ele mesmo abriu (`manutencoes.criado_por = usuario.id`), reforço
  que vive no código de serviço, não apenas na permissão RBAC.

### Planos de manutenção preventiva
- Recorrência por **intervalo de dias OU por horas de uso** (constraint de
  banco garante que exatamente um dos dois esteja preenchido), com execução
  que atualiza `ultima_execucao`/`proxima_prevista`.

### Prestadores e peças
- Prestadores internos/externos com CNPJ/CPF único por empresa.
- Controle de estoque e custo unitário de peças, também único por empresa.

### Anexos
- Upload multipart com **limite de 10 MB** e **validação do tipo real do
  arquivo pelos magic bytes** (não confia na extensão nem no `Content-Type`
  enviado pelo cliente), armazenamento fora do webroot com nome gerado
  (UUID), e download por **URL assinada e expirável** — nunca um caminho de
  arquivo cru exposto ao cliente.

### Dashboard
- Métricas agregadas (ativos, ordens abertas, alertas, custo — este último
  condicionado à permissão `custos.ver`).

### Autenticação e autorização
- Login por **username** (não e-mail), JWT de curta duração (15 min) +
  refresh token de 7 dias com **rotação a cada uso** e hash armazenado no
  banco (nunca o token em texto puro).
- **Bloqueio de conta**: 5 tentativas de senha incorretas seguidas bloqueiam
  o usuário por 15 minutos (HTTP 423), com contador zerado em login
  bem-sucedido ou redefinição de senha.
- **Timing-safe login**: mesmo um `username` inexistente passa por um hash
  Argon2 contra um hash-fantasma fixo, para que o tempo de resposta não
  revele quais usuários existem.
- Cadastro público (`POST /auth/registrar`) cria usuário **inativo por
  padrão**; um admin aprova e só então atribui o perfil real.
- Recuperação de senha por token de uso único, com resposta 200 idêntica
  independentemente de o e-mail existir ou não (evita enumeração de contas).
- RBAC por tabela de permissões (`perfis` → `perfil_permissoes` →
  `permissoes`), verificado por `Depends(requer("<codigo.permissao>"))` em
  cada rota.

### Auditoria
- Toda escrita relevante (insert/update/delete, login, login falho,
  aprovação de cadastro) grava snapshot **antes/depois** em `logs_auditoria`,
  com IP de origem obtido exclusivamente de `request.client.host` (nunca lido
  manualmente de `X-Forwarded-For`, que é tratado pelo próprio uvicorn com
  `--proxy-headers` e uma lista explícita de proxies confiáveis).
- Campos sensíveis (ex.: código de convite da empresa, senhas) nunca são
  gravados na auditoria.

---

## Arquitetura

O sistema segue uma arquitetura em camadas, espelhada propositalmente entre
frontend e backend:

```
Frontend (Expo Router)          Backend (FastAPI)
────────────────────────        ────────────────────────
app/     (rotas, re-export)     routers/   (contrato HTTP, permissões)
view/    (telas)          ⇄     services/  (regra de negócio, sem FastAPI)
services/(chamadas HTTP)        schemas/   (contrato Pydantic, camelCase)
types/   (contratos TS)         models/    (SQLAlchemy 2, um arquivo/tabela)
```

- **Camada de apresentação (frontend)**: Expo Router só faz roteamento — cada
  arquivo em `src/app/` é um re-export de uma tela em `src/view/`, sem lógica
  nem JSX. Isso mantém o roteador "burro" e testável, e as telas
  desacopladas de onde o Expo Router as monta.
- **Camada de acesso a dados (frontend)**: `src/services/` é a única camada
  que fala com a rede (`src/services/api.ts` é o único lugar que chama
  `fetch`). Isso centraliza o tratamento de erro 401 (refresh automático de
  token) e permite trocar mocks por chamadas reais **sem tocar em
  componente algum** — o objetivo explícito de `src/data/` como camada de
  dados mockados isolada.
- **Camada de contrato (backend)**: `schemas/` (Pydantic v2, com
  `alias_generator=to_camel`) garante que a resposta HTTP já sai no formato
  que o TypeScript do frontend espera, sem um DTO/adapter intermediário.
- **Camada de negócio (backend)**: `services/` concentra regra de negócio
  (cálculo de custo total, validação de escopo multi-tenant, bloqueio de
  conta) e não importa nada de FastAPI — pode ser testada isoladamente sem
  subir a aplicação HTTP.
- **Camada de persistência (backend)**: `models/` (SQLAlchemy 2) e Alembic
  para migrações versionadas.
- **Multi-tenancy transversal**: a dependência `escopo_empresa` (injeção via
  `Depends`) atravessa praticamente todos os routers, funcionando como um
  *cross-cutting concern* aplicado de forma consistente (ver seção
  [Multi-tenant](#multi-tenant)).

### Padrões de projeto identificáveis

- **Dependency Injection** via `Depends()` do FastAPI para autenticação,
  autorização e escopo de tenant — a mesma primitiva resolve três
  preocupações transversais diferentes.
- **Repository-like helper** (`obter_do_escopo`) centralizando a busca por id
  com filtro de tenant e resposta 404 uniforme, evitando repetição da
  cláusula `WHERE empresa_id = ...` em cada router.
- **Service Layer** separando regra de negócio de transporte HTTP.
- **DTO / Schema pattern** via Pydantic para desacoplar o modelo de banco do
  contrato de API.
- **Camada de dados substituível** (mock → API) no frontend, um caso de uso
  de inversão de dependência sem necessidade de um container de DI formal —
  a troca acontece porque a *assinatura* do service (`fetchAssets(): Promise<Asset[]>`)
  não muda quando a implementação deixa de ser mock e passa a ser `fetch`.

---

## Stack tecnológica

### Backend
| Camada | Tecnologia |
|---|---|
| Linguagem | Python 3.12 |
| Framework web | FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 |
| Migrações | Alembic |
| Banco de dados | PostgreSQL 16 |
| Driver | psycopg 3 (binário) |
| Validação/Config | Pydantic v2 + pydantic-settings |
| Hash de senha | argon2-cffi |
| JWT | python-jose |
| Rate limiting | slowapi |
| Upload multipart | python-multipart |
| Servidor ASGI | uvicorn (com `--proxy-headers`) |

### Frontend
| Camada | Tecnologia |
|---|---|
| Framework | Expo SDK 57 |
| UI | React Native 0.86 + React 19 |
| Roteamento | expo-router (typed routes) |
| Linguagem | TypeScript (strict) |
| Compilador | React Compiler ligado |
| Sessão segura | expo-secure-store |
| Estilo | `StyleSheet.create` por tela, arquivo `.style.ts` dedicado |

### Infraestrutura
| Item | Tecnologia |
|---|---|
| Orquestração local/produção | Docker Compose (bases `docker-compose.yml` + overlays `dev`/`prod`) |
| Servidor web de produção do frontend | Nginx (build estático do Expo Web) |
| Banco em container | postgres:16-alpine, **sem porta publicada** por padrão |

---

## Estrutura do repositório

```
CMMS/
├── docker-compose.yml                  # infraestrutura compartilhada (postgres + api)
├── docker-compose.dev.yml              # overlay de desenvolvimento
├── docker-compose.prod.yml             # overlay de produção (+ frontend via Nginx)
├── docker-compose.override.example.yml # receita para publicar o postgres no host (dev)
├── .env.example
├── docs/
│   ├── cmms-backend-spec.md            # fonte da verdade: schema, RBAC, endpoints
│   └── cmms-arquitetura-v2.drawio
│
├── backend/
│   ├── Dockerfile                      # usuário não-root
│   ├── requirements.txt
│   ├── alembic/versions/               # 0001_schema_inicial (já multi-tenant)
│   ├── seeds/perfis_permissoes.py      # cria perfis, permissões, admin e superadmin
│   ├── uploads/                        # volume dos anexos, fora do webroot
│   └── app/
│       ├── main.py                     # FastAPI, CORS, slowapi, /health, routers
│       ├── core/                       # config, database, security, permissions,
│       │                               # tenant, auditoria, rate_limit
│       ├── models/                     # SQLAlchemy — um arquivo por tabela
│       ├── schemas/                    # Pydantic (CamelModel) por domínio
│       ├── services/                   # regra de negócio, sem FastAPI
│       └── routers/                    # auth, empresas, usuarios, ativos, dashboard,
│                                       # manutencoes, planos, prestadores, pecas,
│                                       # anexos, auditoria
│
└── frontend/
    ├── Dockerfile / nginx.conf
    └── src/
        ├── app/          # rotas do expo-router (só re-exports) + _layout.tsx
        ├── view/         # telas de verdade, cada uma com seu .style.ts
        ├── components/   # asset-card, status-badge, metric-card, filter-chip...
        ├── context/      # auth-context.tsx — sessão, permissões, login/logout
        ├── services/     # api.ts (fetch wrapper) + *-service.ts por domínio
        ├── hooks/        # use-assets, use-theme, use-color-scheme...
        ├── types/        # contratos de dados (Asset, Categoria, DashboardMetric...)
        ├── constants/    # rotas, tema, labels e cores por status/categoria
        ├── data/         # mocks usados enquanto o backend não está no ar
        └── utils/        # format.ts — conversões de data/decimal API ↔ UI
```

---

## Modelo de domínio

Núcleo relacional (nomes de tabela em português, refletindo o domínio):

```
empresas (tenant)
  └─< usuarios ─< refresh_tokens
  │            ├─< tokens_recuperacao_senha
  │            └─< logs_auditoria (nullable, login sem tenant conhecido)
  ├─< ativos ──< planos_preventiva
  │           ├─< manutencoes ─< manutencao_pecas >─ pecas
  │           └─< anexos (foto | nota_fiscal | laudo | orcamento | outro)
  ├─< prestadores ──< manutencoes
  └─< pecas

perfis ──< perfil_permissoes >── permissoes   (RBAC, N:N)
```

Pontos de modelagem relevantes:

- **`especificacoes JSONB`** em `ativos` guarda os campos que variam por
  categoria (placa/renavam para veículo, potência/tensão para máquina) com
  índice **GIN**, evitando um esquema *entity-attribute-value* completo só
  para poucos atributos variáveis.
- **Custo congelado**: `manutencao_pecas.custo_unitario_na_data` é gravado no
  momento do vínculo, não referenciado dinamicamente de `pecas.custo_unitario_atual`
  — histórico financeiro imutável mesmo que o preço da peça mude depois.
- **Constraint de exclusividade** em `planos_preventiva`
  (`CHECK ((intervalo_dias IS NOT NULL) <> (intervalo_horas IS NOT NULL))`)
  garante no banco, não só na aplicação, que o plano é recorrente por dias
  *ou* por horas de uso, nunca os dois nem nenhum.
- **UNIQUE composto por tenant**: `ativos.codigo`, `ativos.patrimonio`,
  `pecas.codigo` e `prestadores.cnpj_cpf` são únicos por `empresa_id`, não
  globalmente — duas empresas podem cadastrar o mesmo código de patrimônio
  sem colisão.
- **`usuarios.username`/`email` continuam globais** (não compostos por
  tenant), porque o login precisa identificar a pessoa antes de o tenant ser
  conhecido.

---

## Multi-tenant

O isolamento é **por coluna** (`empresa_id`), não por schema nem por banco
separado — cada empresa cliente é uma linha em `empresas`, e toda tabela
operacional carrega uma FK `empresa_id NOT NULL` indexada.

Regras não negociáveis do domínio:

1. **Toda query de dado operacional passa pela dependência `escopo_empresa`**:

   ```python
   @router.get("/ativos")
   def listar(
       usuario: Usuario = Depends(requer("ativos.ver")),
       empresa_id: int = Depends(escopo_empresa),   # obrigatório
   ): ...
   ```

2. **Busca por id nunca é um `SELECT` direto** — passa por
   `obter_do_escopo(db, Modelo, id, empresa_id, ...)`, que já resolve o
   filtro de tenant e o 404 uniforme.

3. **Um registro de outra empresa responde 404, nunca 403.** Um 403
   confirmaria a existência do id em outro tenant — a política é tornar
   "existe, mas não é seu" indistinguível de "não existe".

4. **`escopo_empresa_admin`** (retorna `None` para o superadmin, que enxerga
   todas as empresas) é usado **apenas** em `usuarios`, `auditoria` e
   `empresas` — as únicas telas onde visão cross-tenant é intencional.

5. **Superadmin não tem visão operacional**: possui só
   `empresas.gerenciar` + `usuarios.gerenciar`; um `GET /ativos` como
   superadmin responde 403. Ele existe na empresa "Plataforma", que não tem
   dado operacional.

6. **Cadastro por convite**: `POST /auth/registrar` recebe `codigoConvite`
   (não o nome da empresa digitado à mão), resolvido via
   `empresas.codigo_convite` — alfabeto sem caracteres ambíguos (sem `0/O`,
   `1/I/L`) pensado para ser ditado por telefone. Código inválido ou de
   empresa desativada devolve 400 genérico, sem revelar qual dos dois casos
   ocorreu.

---

## Segurança

Resumo dos controles implementados (detalhes completos na seção 6 de
`docs/cmms-backend-spec.md`):

| Controle | Implementação |
|---|---|
| Hash de senha | Argon2 (`argon2-cffi`) |
| Sessão | JWT HS256, access token de 15 min |
| Refresh | 7 dias, hash armazenado no banco, **rotação a cada uso** |
| Autorização | `Depends(requer("<permissao>"))` em toda rota protegida |
| Validação de entrada | Pydantic em 100% dos endpoints; zero SQL com f-string |
| Rate limiting | `slowapi` em `/auth/*` e `/anexos` |
| CORS | Restrito às origens definidas em `.env` (nunca `*`) |
| Upload de arquivo | Limite de 10 MB + validação do MIME real por magic bytes |
| Download de anexo | URL assinada, expirável (`DOWNLOAD_TOKEN_EXPIRE_MINUTES`) |
| Bloqueio de força bruta | 5 tentativas falhas → bloqueio de 15 min (HTTP 423) |
| Anti-enumeração de login | Argon2 contra hash-fantasma para username inexistente |
| Anti-enumeração de recuperação de senha | Resposta 200 idêntica, exista ou não o e-mail |
| IP de auditoria | Só `request.client.host`; `X-Forwarded-For` tratado pelo uvicorn com `--proxy-headers` e `FORWARDED_ALLOW_IPS` explícito |
| Isolamento de tenant | 404 (nunca 403) para registro de outra empresa |
| Segredos | `.env` fora do Git; `ADMIN_PASSWORD`/`SUPERADMIN_PASSWORD`/`JWT_SECRET` **sem valor padrão** — a aplicação não sobe sem eles |
| Exposição de docs | `/docs`, `/redoc` e `/openapi.json` só quando `DEBUG=true` |
| Banco de dados | Postgres **sem porta publicada** no compose versionado (produção); override opcional só para dev local |
| Processo | API roda como usuário não-root no container |
| Sessão no frontend | Access token só em memória; refresh token em `expo-secure-store`; fallback de `localStorage` na web restrito a `__DEV__` |
| Dado sensível na auditoria | Código de convite e senhas nunca gravados em `logs_auditoria` |

---

## API — endpoints

Prefixo `/api/v1`. Toda rota fora de `/auth/*` exige `Authorization: Bearer <jwt>`.

| Domínio | Rotas principais | Observação |
|---|---|---|
| **Auth** | `POST /auth/login`, `/refresh`, `/logout`, `/registrar`, `/recuperar-senha`, `/redefinir-senha`, `GET /auth/me` | login/registro/recuperação com rate limit |
| **Empresas** | `GET/POST/PATCH /empresas`, `POST /empresas/{id}/regenerar-convite`, `GET /empresas/minha` | administração de tenants (superadmin) |
| **Usuários** | `GET /usuarios?pendentes=true`, `PATCH /usuarios/{id}/aprovar`, `PATCH /usuarios/{id}`, `GET/POST/PATCH /perfis` | aprovação de cadastro e RBAC |
| **Ativos** | `GET/POST /ativos`, `GET/PATCH/DELETE /ativos/{id}` | CRUD completo + filtros |
| **Dashboard** | `GET /dashboard/metricas` | métricas agregadas (custo condicionado a `custos.ver`) |
| **Manutenções** | `GET/POST /manutencoes`, `GET/PATCH/DELETE /manutencoes/{id}`, `POST/DELETE /manutencoes/{id}/pecas` | ordens de serviço |
| **Planos preventivos** | `GET/POST /planos`, `PATCH/DELETE /planos/{id}`, `POST /planos/{id}/executar` | recorrência por dias ou horas |
| **Prestadores / Peças** | CRUD completo em `/prestadores` e `/pecas` | únicos por empresa |
| **Anexos** | `POST /anexos` (multipart), `GET /anexos/{id}/download` (URL assinada), `DELETE /anexos/{id}` | validação de MIME real |
| **Auditoria** | `GET /auditoria?tabela=&usuarioId=&de=&ate=` | somente `auditoria.ver` |
| **Health** | `GET /health` | público, usado no healthcheck do compose |

---

## Como rodar o projeto

### Pré-requisitos
- Docker + Docker Compose
- Node.js (para rodar o Expo fora do container em desenvolvimento)

### Desenvolvimento

```bash
# 1) configurar variáveis de ambiente
cp .env.example .env
# ajuste POSTGRES_PASSWORD, JWT_SECRET, ADMIN_PASSWORD, SUPERADMIN_PASSWORD

# 2) opcional: publicar o postgres no host para DBeaver/psql
cp docker-compose.override.example.yml docker-compose.override.yml

# 3) subir postgres + api
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# 4) aplicar migrações e seed inicial
docker compose exec api alembic upgrade head
docker compose exec api python -m seeds.perfis_permissoes
# ^ imprime o código de convite da empresa "Demo"

# 5) subir o frontend via Expo (terminal separado)
cd frontend
npx expo start --web --port 8082
```

Acesso: `http://localhost:8082` (frontend) · API em `http://localhost:8080/api/v1`.

> A imagem da API carrega o código com `COPY . .`: `docker compose restart`
> **não** recarrega alterações — use `docker compose up -d --build api`.

### Produção

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build
```

Acesso: `http://localhost:8081` (frontend servido por Nginx a partir do build
estático do Expo Web) · API em `http://localhost:8080/api/v1`.

### Comandos úteis

```bash
docker compose exec api alembic revision -m "..."   # nova migration
docker compose logs -f api                           # logs da API
cd frontend && npx tsc --noEmit                       # checagem de tipos
cd frontend && npx expo lint                          # lint
```

---

## Variáveis de ambiente

Definidas em `.env` (raiz do repo), a partir de `.env.example`:

| Variável | Padrão | Observação |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_DB` | `cmms` | |
| `POSTGRES_PASSWORD` | — | obrigatória |
| `API_PORT` | `8080` | porta no host; container escuta na 8000 |
| `JWT_SECRET` | — | obrigatória: `openssl rand -hex 32` |
| `DEBUG` | `false` | `true` libera `/docs` e `/redoc` |
| `CORS_ORIGINS` | `http://localhost:8081` | separadas por vírgula |
| `FORWARDED_ALLOW_IPS` | vazio | proxies confiáveis do uvicorn; nunca `*` na internet |
| `POSTGRES_HOST_PORT` | `5432` | só com `docker-compose.override.yml` |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` | `admin` / `admin@cmms.local` | admin da empresa "Demo" |
| `ADMIN_PASSWORD` | — | **obrigatória, sem default** |
| `SUPERADMIN_USERNAME` / `SUPERADMIN_EMAIL` | `superadmin` / `superadmin@cmms.local` | admin da plataforma |
| `SUPERADMIN_PASSWORD` | — | **obrigatória, sem default** |
| `EXPO_PUBLIC_API_URL` (frontend) | — | base da API já com `/api/v1`; sem ela o app roda em **modo mock** |

---

## Roadmap

Itens em aberto identificados no acompanhamento do projeto:

- [ ] Tela de recuperação de senha (`recuperarSenha.tsx`) — conectar ao fluxo
      de token já existente no backend.
- [ ] Link "Criar conta" na tela de login.
- [ ] Substituição progressiva das camadas de mock (`src/data/`) por chamadas
      reais aos services já implementados no backend.
- [ ] **Suíte de testes automatizados e pipeline de CI** — lacuna identificada
      como o principal débito técnico atual do projeto (ausência de testes
      unitários/integração no backend e de testes de componente no frontend).

---

## Escalabilidade — próximos passos de arquitetura

A base atual (multi-tenant por coluna, camadas desacopladas, contrato
tipado ponta a ponta) foi desenhada para crescer sem reescrita. Os próximos
incrementos de escala, em ordem de prioridade esperada:

### 1. Camada de dados
- **Índices já existentes** (`status`, `categoria`, `localizacao` em
  `ativos`; GIN em `especificacoes`; compostos em `manutencoes`) cobrem os
  filtros de listagem atuais — o próximo gargalo esperado é o **volume de
  `logs_auditoria`**, que cresce indefinidamente. Recomenda-se particionamento
  por data (`PARTITION BY RANGE (criado_em)`) antes que o índice
  `(usuario_id, criado_em)` deixe de caber em memória.
- **Read replicas** do Postgres para separar tráfego de leitura (dashboard,
  relatórios, auditoria) do tráfego de escrita (ordens de manutenção),
  usando `SessionLocal` distinto por rota de leitura pesada.
- **Connection pooling externo** (PgBouncer) à medida que o número de
  instâncias da API cresce horizontalmente — SQLAlchemy com múltiplos workers
  Uvicorn/Gunicorn multiplica conexões rapidamente.

### 2. Camada de aplicação
- A API já é **stateless** (JWT + refresh token em banco, sem sessão em
  memória do processo), o que a torna diretamente **escalável
  horizontalmente atrás de um load balancer** — não há estado de sessão para
  replicar entre instâncias. Rodar `uvicorn` com múltiplos workers ou
  múltiplas réplicas do container `api` é uma mudança de infraestrutura, não
  de código.
- **Rate limiting distribuído**: `slowapi` hoje funciona em memória por
  processo; com múltiplas réplicas, migrar o backend do limiter para Redis
  evita que cada instância aplique o limite de forma independente (e portanto
  frouxa demais em conjunto).
- **Cache de leitura** (Redis) para `GET /dashboard/metricas` e listagens de
  `GET /ativos` com filtro, invalidado por evento de escrita — reduz consultas
  agregadas repetidas nas telas mais acessadas.

### 3. Processamento assíncrono
- **Fila de mensagens** (Redis + RQ, ou Celery/RabbitMQ) para tarefas que hoje
  seriam síncronas e não deveriam bloquear a resposta HTTP: envio de e-mail de
  recuperação de senha, cálculo de vencimento de planos preventivos em lote,
  geração de relatórios exportados (`relatorios.exportar`).
- **Armazenamento de anexos**: migrar o volume local (`backend/uploads/`) para
  um object storage compatível com S3 (MinIO on-premise ou S3 gerenciado),
  preparando o terreno para múltiplas réplicas da API sem depender de volume
  compartilhado por container.

### 4. Multi-tenant em escala
- O isolamento por coluna já elimina a necessidade de reescrever a aplicação
  para suportar novos tenants — cadastrar uma empresa é uma operação de dado,
  não de infraestrutura. Se o volume de um tenant específico crescer muito
  além dos demais, o desenho atual permite migrar esse tenant para
  **particionamento por `empresa_id`** nas tabelas mais quentes
  (`ativos`, `manutencoes`, `logs_auditoria`) sem mudar a lógica de aplicação,
  já que toda query já passa obrigatoriamente por `empresa_id`.
- Caso um cliente exija isolamento físico (contratual ou regulatório), a
  mesma abstração de `escopo_empresa` permite evoluir para **schema por
  tenant** ou **banco por tenant** trocando a resolução de `empresa_id` por
  uma resolução de *connection string*, sem tocar em `routers/` nem
  `services/`.

### 5. Observabilidade
- Hoje a auditoria de negócio (`logs_auditoria`) não substitui observabilidade
  de infraestrutura. Adicionar logging estruturado (JSON) + tracing
  distribuído (OpenTelemetry) e métricas de latência por rota é o pré-requisito
  para decidir *onde* escalar — sem essa camada, decisões de scaling seriam
  baseadas em suposição, não em dado.

### 6. Frontend
- O Expo Web em produção já compila para estático servido por Nginx —
  escalar horizontalmente é trivial (CDN + múltiplas réplicas stateless do
  Nginx). O ponto de atenção é a sessão em memória na web: por não haver
  `expo-secure-store` no navegador, um usuário perde a sessão ao atualizar a
  página em produção — comportamento intencional por segurança, mas que deve
  ser comunicado explicitamente ao usuário (hoje o app apenas volta para o
  login).

**Resumo da tese de escalabilidade**: a arquitetura atual escala primeiro
*verticalmente* (mais CPU/memória no Postgres e na API) sem nenhuma mudança
de código, e comporta escala *horizontal* da API imediatamente por já ser
stateless. Os únicos pontos que exigem decisão arquitetural adicional antes de
escalar são o rate limiter (hoje em memória de processo) e o armazenamento de
anexos (hoje em volume local) — ambos documentados acima com o caminho de
migração.

---

## Contribuindo

O projeto segue convenções documentadas em `CLAUDE.md` (raiz e `frontend/`),
incluindo:

- Comentários de código, mensagens de commit e textos de interface em
  português.
- Rotas do frontend (`src/app/`) só re-exportam telas de `src/view/`; nenhuma
  lógica ou JSX no arquivo de rota.
- Toda query de dado operacional no backend passa por `escopo_empresa`; ver
  seção [Multi-tenant](#multi-tenant) antes de tocar em qualquer rota nova.
- `docs/cmms-backend-spec.md` é a fonte da verdade para schema, RBAC e
  contrato de endpoints — consulte antes de alterar tipo de dado ou permissão.

## Licença

Licença do projeto não definida neste repositório até o momento.
