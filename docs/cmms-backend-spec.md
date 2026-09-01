# CMMS — Especificação do Backend (v2, alinhada ao frontend)

Stack: Python 3.12 · FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL 16 · Docker Compose

Princípio: **o backend fala a língua do front.** Os enums usam os mesmos valores que o
`frontend/src/types/assets.ts` e `cadAtivos.tsx` já usam, e as respostas da API saem
em camelCase com o mesmo formato dos mocks, pra trocar `MOCK_ASSETS` por `fetch` sem
tocar em componente nenhum.

---

## 1. Decisões tomadas a partir do front

| Tela / arquivo do front | Decisão no backend |
|---|---|
| `types/assets.ts` chama de `Asset` | Tabela `ativos` (não `equipamentos`) |
| `cadAtivos.tsx` tem categoria + tipo + ~25 campos | `ativos` ganha esses campos; os blocos de veículo e máquina vão em `especificacoes JSONB` |
| `AssetStatus` = operational / maintenance / stopped / alert | Enum `status_ativo` com esses exatos valores |
| `Categoria` = vehicle / industrialMachine / equipment / electrical / infrastructure / other | Enum `categoria_ativo` com esses exatos valores |
| `login.tsx` loga com **username** + senha | `usuarios.username UNIQUE`; login não é por email |
| `cadUser.tsx` pede username, cargo, código da empresa, funcao, email, senha e diz "solicitar acesso" | Cadastro público cria usuário com `ativo = false`; um admin aprova e define o perfil. A empresa **não é digitada**: vem do `codigoConvite` (§8.6); `funcao` é só o que a pessoa se descreve, o perfil real quem define é o admin |
| `recuperarSenha.tsx` | Tabela `tokens_recuperacao_senha` + envio de email |
| `Asset.isMaintenanceOverdue` | Calculado: existe `planos_preventiva` ativo com `proxima_prevista < hoje` |
| `Asset.lastMaintenanceDate` | Calculado: `MAX(manutencoes.data_servico)` do ativo |
| `MOCK_METRICS` da home | Endpoint `GET /dashboard/metricas`, nada de tabela |

> Inconsistência no front pra o Gabriel ajustar: `types/assets.ts` tem `AssetType = machine | compressor | vehicle`,
> mas `cadAtivos.tsx` usa `categoria` + `tipo` livre. Sugestão: `Asset` passa a ter `category: Categoria` e `type: string`,
> e `TYPE_LABELS` em `constants/asset-status.ts` vira `CATEGORY_LABELS`.

---

## 2. Schema do banco (PostgreSQL)

### 2.1 Usuários e privilégios (RBAC)

```
perfis
  id            serial PK
  nome          varchar(50) UNIQUE      -- admin | gerente | funcionario | leitura
  descricao     text

permissoes
  id            serial PK
  codigo        varchar(80) UNIQUE      -- ex: ativos.criar
  descricao     text

perfil_permissoes
  perfil_id     FK → perfis(id) ON DELETE CASCADE
  permissao_id  FK → permissoes(id) ON DELETE CASCADE
  PK (perfil_id, permissao_id)

usuarios
  id            serial PK
  username      varchar(50) UNIQUE NOT NULL
  email         varchar(255) UNIQUE NOT NULL
  senha_hash    text NOT NULL             -- argon2
  cargo         varchar(100)
  empresa       varchar(150)
  funcao        varchar(100)              -- texto livre informado no cadastro
  perfil_id     FK → perfis(id)  NULL     -- NULL até o admin aprovar
  ativo         boolean DEFAULT false     -- false = aguardando aprovação
  ultimo_login  timestamptz
  criado_em     timestamptz DEFAULT now()
  atualizado_em timestamptz

refresh_tokens
  id            serial PK
  usuario_id    FK → usuarios(id) ON DELETE CASCADE
  token_hash    text UNIQUE NOT NULL
  expira_em     timestamptz NOT NULL
  revogado      boolean DEFAULT false
  criado_em     timestamptz DEFAULT now()
  IDX (usuario_id)

tokens_recuperacao_senha
  id            serial PK
  usuario_id    FK → usuarios(id) ON DELETE CASCADE
  token_hash    text UNIQUE NOT NULL
  expira_em     timestamptz NOT NULL      -- 30 min
  usado         boolean DEFAULT false
  criado_em     timestamptz DEFAULT now()

logs_auditoria
  id            bigserial PK
  usuario_id    FK → usuarios(id) NULL
  acao          varchar(20)               -- insert | update | delete | login | login_falho | aprovacao
  tabela        varchar(50)
  registro_id   integer
  dados_antes   jsonb
  dados_depois  jsonb
  ip            inet
  criado_em     timestamptz DEFAULT now()
  IDX (tabela, registro_id) | IDX (usuario_id, criado_em)
```

### 2.2 Núcleo do CMMS

```
ativos
  id                 serial PK
  -- Identificação (etapa 1 do cadAtivos)
  nome               varchar(150) NOT NULL
  categoria          categoria_ativo NOT NULL   -- enum: vehicle | industrialMachine | equipment | electrical | infrastructure | other
  tipo               varchar(80)                -- 'Torno', 'Caminhão'... (lista do TIPOS_POR_CATEGORIA)
  codigo             varchar(50) UNIQUE
  patrimonio         varchar(50)
  -- Características
  fabricante         varchar(100)
  modelo             varchar(100)
  ano                smallint
  numero_serie       varchar(100)
  -- Operação
  localizacao        varchar(150)
  responsavel        varchar(150)
  status             status_ativo NOT NULL DEFAULT 'operational'  -- enum: operational | maintenance | stopped | alert
  horimetro_atual    numeric(12,2)
  quilometragem      numeric(12,2)
  -- Aquisição
  data_aquisicao     date
  fornecedor         varchar(150)
  valor_aquisicao    numeric(14,2)
  numero_nota_fiscal varchar(60)
  garantia_ate       date
  observacoes        text
  -- Específicos por categoria (veículo: placa, renavam, chassi, combustivel | máquina: potencia, tensao, capacidade)
  especificacoes     jsonb DEFAULT '{}'
  -- Auditoria
  criado_por         FK → usuarios(id)
  atualizado_por     FK → usuarios(id)
  criado_em          timestamptz DEFAULT now()
  atualizado_em      timestamptz
  IDX (status) | IDX (categoria) | IDX (localizacao) | GIN (especificacoes)

prestadores
  id            serial PK
  nome          varchar(150) NOT NULL
  cnpj_cpf      varchar(18) UNIQUE
  telefone      varchar(20)
  email         varchar(255)
  tipo          varchar(10)               -- interno | externo
  criado_por / atualizado_por / criado_em / atualizado_em

pecas
  id                    serial PK
  nome                  varchar(150) NOT NULL
  codigo                varchar(50) UNIQUE
  unidade               varchar(10)       -- un, kg, l, m
  custo_unitario_atual  numeric(12,2)
  estoque               numeric(12,2) DEFAULT 0
  criado_por / atualizado_por / criado_em / atualizado_em

manutencoes
  id                    serial PK
  ativo_id              FK → ativos(id) NOT NULL
  prestador_id          FK → prestadores(id)
  tipo                  tipo_manutencao NOT NULL   -- enum: preventiva | corretiva | preditiva
  status                status_manutencao NOT NULL DEFAULT 'aberta'  -- enum: aberta | em_andamento | concluida | cancelada
  descricao             text
  data_abertura         timestamptz DEFAULT now()
  data_servico          date
  data_conclusao        date
  horimetro_no_servico  numeric(12,2)
  custo_mao_de_obra     numeric(12,2) DEFAULT 0
  custo_pecas           numeric(12,2) DEFAULT 0    -- soma de manutencao_pecas
  custo_total           numeric(12,2) DEFAULT 0    -- mao_de_obra + pecas
  criado_por / atualizado_por / criado_em / atualizado_em
  IDX (ativo_id, data_servico) | IDX (prestador_id) | IDX (tipo) | IDX (status)

manutencao_pecas
  manutencao_id          FK → manutencoes(id) ON DELETE CASCADE
  peca_id                FK → pecas(id)
  quantidade             numeric(12,2) NOT NULL
  custo_unitario_na_data numeric(12,2) NOT NULL    -- congelado no momento do uso
  PK (manutencao_id, peca_id)

planos_preventiva
  id               serial PK
  ativo_id         FK → ativos(id) ON DELETE CASCADE
  descricao        varchar(200) NOT NULL
  intervalo_dias   integer
  intervalo_horas  integer
  ultima_execucao  date
  proxima_prevista date
  ativo            boolean DEFAULT true
  criado_por / criado_em
  CHECK ((intervalo_dias IS NOT NULL) <> (intervalo_horas IS NOT NULL))   -- exatamente um
  IDX (ativo_id) | IDX (proxima_prevista) WHERE ativo = true

anexos
  id              serial PK
  manutencao_id   FK → manutencoes(id) ON DELETE CASCADE  NULL
  ativo_id        FK → ativos(id) ON DELETE CASCADE       NULL   -- foto/nota fiscal do próprio ativo
  tipo            tipo_anexo NOT NULL   -- enum: foto | nota_fiscal | laudo | orcamento | outro
  caminho_arquivo text NOT NULL         -- UUID.ext, fora do webroot
  nome_original   varchar(255)
  mime_type       varchar(100)
  tamanho_bytes   integer
  enviado_por     FK → usuarios(id)
  criado_em       timestamptz DEFAULT now()
  CHECK (manutencao_id IS NOT NULL OR ativo_id IS NOT NULL)
```

Ordem de criação na migration: `perfis → permissoes → perfil_permissoes → usuarios → refresh_tokens →
tokens_recuperacao_senha → logs_auditoria → ativos → prestadores → pecas → manutencoes → manutencao_pecas →
planos_preventiva → anexos`.

### 2.3 Seeds de perfis e permissões

Códigos de permissão: `<recurso>.<acao>`

| permissão | admin | gerente | funcionario | leitura |
|---|:-:|:-:|:-:|:-:|
| `ativos.ver` `manutencoes.ver` `planos.ver` `prestadores.ver` `pecas.ver` `dashboard.ver` | ✔ | ✔ | ✔ | ✔ |
| `ativos.criar` `ativos.editar` | ✔ | ✔ | | |
| `ativos.deletar` | ✔ | ✔ | | |
| `manutencoes.criar` `manutencoes.editar` | ✔ | ✔ | ✔ | |
| `manutencoes.deletar` | ✔ | ✔ | | |
| `planos.criar` `planos.editar` `planos.deletar` | ✔ | ✔ | | |
| `prestadores.*` `pecas.*` (criar/editar/deletar) | ✔ | ✔ | | |
| `anexos.enviar` | ✔ | ✔ | ✔ | |
| `anexos.deletar` | ✔ | ✔ | | |
| `custos.ver` | ✔ | ✔ | | |
| `relatorios.exportar` | ✔ | ✔ | | |
| `usuarios.ver` | ✔ | ✔ | | |
| `usuarios.aprovar` `usuarios.gerenciar` `perfis.gerenciar` | ✔ | | | |
| `auditoria.ver` | ✔ | | | |

Regra extra no código (não é permissão): **funcionario só edita manutenção que ele mesmo criou**
(`manutencoes.criado_por = usuario.id`).

---

## 3. Estrutura de pastas do backend

Espelha a organização do front (`view → services → types`) em `routers → services → schemas`,
um módulo por domínio, com os mesmos nomes de domínio que o front usa.

```
backend/
├── Dockerfile
├── requirements.txt
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 0001_schema_inicial.py
├── seeds/
│   └── perfis_permissoes.py        # roda uma vez: cria perfis, permissões e o admin inicial
├── uploads/                        # volume Docker, fora do webroot (.gitignore)
└── app/
    ├── main.py                     # FastAPI(), CORS, routers, /health
    ├── core/
    │   ├── config.py               # Settings via pydantic-settings (.env)
    │   ├── database.py             # engine, SessionLocal, Base, get_db
    │   ├── security.py             # argon2 hash/verify, criar/validar JWT
    │   ├── permissions.py          # Depends(requer("ativos.criar"))
    │   └── auditoria.py            # helper que grava em logs_auditoria
    ├── models/                     # SQLAlchemy 2 (um arquivo por tabela)
    │   ├── __init__.py
    │   ├── usuario.py  perfil.py  permissao.py  refresh_token.py
    │   ├── token_recuperacao.py  log_auditoria.py
    │   ├── ativo.py  prestador.py  peca.py
    │   ├── manutencao.py  manutencao_peca.py  plano_preventiva.py  anexo.py
    │   └── enums.py                # categoria_ativo, status_ativo, tipo_manutencao, ...
    ├── schemas/                    # Pydantic v2 — saída em camelCase (alias_generator=to_camel)
    │   ├── auth.py                 # LoginRequest{username, senha}, TokenResponse, RegistroRequest
    │   ├── usuario.py
    │   ├── ativo.py                # AtivoOut espelha o type Asset do front
    │   ├── dashboard.py            # DashboardMetric{id, label, value}
    │   ├── manutencao.py  prestador.py  peca.py  plano.py  anexo.py
    │   └── common.py               # Paginacao, MensagemResponse
    ├── routers/
    │   ├── auth.py  usuarios.py  ativos.py  dashboard.py
    │   ├── manutencoes.py  planos.py  prestadores.py  pecas.py  anexos.py
    │   └── auditoria.py
    └── services/                   # regra de negócio, sem FastAPI aqui
        ├── auth_service.py  usuario_service.py  ativo_service.py
        ├── dashboard_service.py  manutencao_service.py  plano_service.py
        └── anexo_service.py
```

---

## 4. Endpoints — mapeados tela a tela

Prefixo `/api/v1`. Todo endpoint fora de `/auth/*` exige `Authorization: Bearer <jwt>`.

### `login.tsx` / `cadUser.tsx` / `recuperarSenha.tsx` → `routers/auth.py`

| Método | Rota | Corpo | Retorno | Permissão |
|---|---|---|---|---|
| POST | `/auth/login` | `{username, senha}` | `{accessToken, refreshToken, usuario: {id, username, perfil, permissoes[]}}` | público (rate limit 5/min) |
| POST | `/auth/refresh` | `{refreshToken}` | novo par de tokens | público |
| POST | `/auth/logout` | `{refreshToken}` | 204 | logado |
| POST | `/auth/registrar` | `{username, cargo, codigoConvite, funcao, email, senha}` | 201 `{mensagem: "Solicitação enviada, aguarde aprovação"}` | público (rate limit) |
| POST | `/auth/recuperar-senha` | `{email}` | 200 sempre (não revela se email existe) | público (rate limit) |
| POST | `/auth/redefinir-senha` | `{token, novaSenha}` | 200 | público |
| GET | `/auth/me` | | usuário logado + permissões | logado |

Login de usuário com `ativo = false` retorna 403 `"Cadastro aguardando aprovação"`.

### Aprovação de cadastros → `routers/usuarios.py`

| Método | Rota | Permissão |
|---|---|---|
| GET | `/usuarios?pendentes=true` | `usuarios.ver` |
| PATCH | `/usuarios/{id}/aprovar` `{perfilId}` | `usuarios.aprovar` |
| PATCH | `/usuarios/{id}` | `usuarios.gerenciar` |
| GET/POST/PATCH | `/perfis`, `/perfis/{id}/permissoes` | `perfis.gerenciar` |

### `home.tsx` → `routers/dashboard.py` + `routers/ativos.py`

| Front hoje | Endpoint | Retorno |
|---|---|---|
| `fetchDashboardMetrics()` | `GET /dashboard/metricas` | `[{id:'assets', label, value}, {id:'open',...}, {id:'alerts',...}, {id:'cost',...}]` — `cost` só vem se tiver `custos.ver` |
| `fetchAssets()` | `GET /ativos?status=&busca=&page=` | `[{id, name, category, type, location, status, lastMaintenanceDate, isMaintenanceOverdue}]` |

### `cadAtivos.tsx` → `routers/ativos.py`

| Método | Rota | Permissão |
|---|---|---|
| POST | `/ativos` (corpo com os campos do formulário em camelCase; placa/renavam/chassi/combustivel/potencia/tensao/capacidade vão dentro de `especificacoes`) | `ativos.criar` |
| GET | `/ativos/{id}` (detalhe completo + últimas manutenções + planos) | `ativos.ver` |
| PATCH | `/ativos/{id}` | `ativos.editar` |
| DELETE | `/ativos/{id}` | `ativos.deletar` |

### Telas ainda não existentes no front (backend já entrega)

| Rota | Permissão |
|---|---|
| `GET/POST /manutencoes`, `GET/PATCH/DELETE /manutencoes/{id}` | `manutencoes.*` |
| `POST /manutencoes/{id}/pecas`, `DELETE /manutencoes/{id}/pecas/{pecaId}` | `manutencoes.editar` |
| `GET/POST /planos`, `PATCH/DELETE /planos/{id}`, `POST /planos/{id}/executar` | `planos.*` |
| `GET/POST/PATCH/DELETE /prestadores`, `/pecas` | `prestadores.*`, `pecas.*` |
| `POST /anexos` (multipart, max 10 MB, mime real validado), `GET /anexos/{id}/download` (URL assinada), `DELETE /anexos/{id}` | `anexos.*` |
| `GET /auditoria?tabela=&usuarioId=&de=&ate=` | `auditoria.ver` |
| `GET /health` | público |

---

## 5. O que o front precisa ganhar pra conectar

1. `src/services/api.ts` — wrapper de `fetch` com `EXPO_PUBLIC_API_URL`, injeta o Bearer, faz refresh automático em 401.
2. `src/context/auth-context.tsx` — guarda tokens em `expo-secure-store`, expõe `usuario`, `permissoes`, `temPermissao('ativos.criar')`, `login()`, `logout()`.
3. `src/app/_layout.tsx` — redireciona pro login se não autenticado; home e cadastros só logado.
4. `services/assets-service.ts` — trocar `return MOCK_ASSETS` por `api.get('/ativos')`. Mesma assinatura, nada mais muda.
5. `login.tsx` — remover o `console.log` da senha; chamar `POST /auth/login`.
6. `cadUser.tsx` — chamar `POST /auth/registrar` e mostrar "aguarde aprovação".
7. `home.tsx` — botão "+ Novo ativo" só aparece se `temPermissao('ativos.criar')`.
8. `app.json` — apontar `icon` e `adaptiveIcon` pra arquivos que existem (hoje só tem `CMMS_Logo.png`).

---

## 6. Segurança embutida desde o esqueleto

- Argon2 pra senha (`argon2-cffi`); JWT HS256 de 15 min; refresh de 7 dias com hash no banco e rotação a cada uso
- `Depends(requer("<permissao>"))` em toda rota; funcionário só edita o que criou
- Pydantic em toda entrada; só SQLAlchemy, zero SQL com f-string
- `slowapi` em `/auth/*` e `/anexos`
- CORS só pros origins do `.env`; HTTPS via Caddy/Nginx no deploy
- Postgres sem porta publicada no compose; API roda como usuário não-root
- `.env` no `.gitignore`, `.env.example` versionado
- `DEBUG=false` e `/docs` só em desenvolvimento
- `logs_auditoria` em todo insert/update/delete e em login (ok e falho)

---

## 7. Prompt pronto pro Claude Code (rodar na raiz do repo)

```
Leia o arquivo docs/cmms-backend-spec.md e o frontend em frontend/src (types/assets.ts,
constants/asset-status.ts, data/mock-assets.ts, view/cadAtivos/cadAtivos.tsx, view/cadUser/cadUser.tsx,
view/login/login.tsx). Depois crie o backend em backend/ EXATAMENTE conforme a seção 3 da spec:

- Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 16, pydantic-settings, argon2-cffi,
  python-jose, slowapi, python-multipart
- docker-compose.yml na raiz do repo com serviços api e postgres; postgres SEM ports: publicadas;
  volume pra dados do postgres e outro pra backend/uploads
- Dockerfile com usuário não-root
- .env.example na raiz e .env no .gitignore
- Todos os models da seção 2, com os enums usando os MESMOS valores string que o front usa
- Schemas Pydantic com alias_generator=to_camel e populate_by_name=True, pra a API responder em camelCase
  no mesmo formato do type Asset e DashboardMetric do front
- Migration Alembic 0001 criando tudo na ordem indicada
- seeds/perfis_permissoes.py criando os 4 perfis, todas as permissões da tabela da seção 2.3 e um usuário
  admin inicial (username e senha vindos do .env)
- Routers e endpoints da seção 4, com a dependência requer("<permissao>") em cada um
- GET /health

Ao terminar, suba com docker compose, rode a migration e o seed, e me mostre o retorno de
GET /api/v1/health e de POST /api/v1/auth/login com o admin do .env.
Responda sempre em português.
```

---

## 8. Multi-tenant

O CMMS atende várias empresas no mesmo banco. Cada empresa é um **tenant**, e o
isolamento é por coluna (`empresa_id`), não por schema nem por banco separado.

### 8.1 Tabela `empresas`

```
empresas
  id             serial PK
  nome           varchar(150) NOT NULL
  cnpj           varchar(18) UNIQUE NULL
  codigo_convite varchar(12) UNIQUE NOT NULL   -- aleatório, regenerável
  ativo          boolean DEFAULT true
  criado_em      timestamptz DEFAULT now()
```

O `codigo_convite` usa um alfabeto sem caracteres ambíguos (sem `0/O`, `1/I/L`)
porque é ditado por telefone e digitado à mão. Ele **nunca entra em
`logs_auditoria`**: está na lista de campos sensíveis do `core/auditoria.py`.

### 8.2 `empresa_id` nas demais tabelas

`empresa_id` FK → `empresas(id)`, **NOT NULL**, com índice, em:
`usuarios`, `ativos`, `prestadores`, `pecas`, `manutencoes`,
`planos_preventiva` e `anexos`.

Em `logs_auditoria` a coluna é **nullable**: um login falho de username
inexistente não tem tenant conhecido.

Os UNIQUE viraram compostos, porque duas empresas podem usar o mesmo código:

| antes (global) | agora |
|---|---|
| `ativos.codigo` | `UNIQUE (empresa_id, codigo)` |
| `ativos.patrimonio` | `UNIQUE (empresa_id, patrimonio)` |
| `pecas.codigo` | `UNIQUE (empresa_id, codigo)` |
| `prestadores.cnpj_cpf` | `UNIQUE (empresa_id, cnpj_cpf)` |

`usuarios.username` e `usuarios.email` **continuam globais**: o login acontece
antes de se saber o tenant, então precisam identificar a pessoa no sistema todo.

`usuarios.empresa` (texto livre digitado no cadastro) deixou de existir — a
empresa agora é a FK, e a API devolve `empresa: {id, nome}`.

### 8.3 A regra que não se quebra

**Toda query de dado operacional filtra por `empresa_id`.** O filtro vem da
dependência `escopo_empresa` (`app/core/tenant.py`):

```python
@router.get("/ativos")
def listar(
    usuario: Usuario = Depends(requer("ativos.ver")),
    empresa_id: int = Depends(escopo_empresa),
): ...
```

Para carregar um registro por id, use `obter_do_escopo`, que já devolve 404
quando o registro é de outra empresa:

```python
ativo = obter_do_escopo(db, Ativo, ativo_id, empresa_id,
                        nao_encontrado="Ativo não encontrado.")
```

**Referências cruzadas** (criar manutenção apontando `ativoId`/`prestadorId`,
vincular `pecaId`, anexar a uma manutenção) validam que o alvo é da mesma
empresa pelo mesmo helper.

> **404, nunca 403.** Um 403 confirmaria que aquele id existe em outro tenant.
> Registro fora do escopo tem de ser indistinguível de registro inexistente.

Para as telas administrativas existe `escopo_empresa_admin`, que devolve `None`
para o superadmin (vê todas as empresas) e o `empresa_id` para os demais. Só use
onde ver várias empresas é intencional: `usuarios`, `auditoria`, `empresas`.

### 8.4 Perfil `superadmin`

Administra a **plataforma**, não o CMMS. Permissões: `empresas.gerenciar` e
`usuarios.gerenciar` — e mais nenhuma. Não tem `ativos.ver`, `manutencoes.ver`
nem `custos.ver`, então não enxerga dado operacional de empresa alguma (um
`GET /ativos` como superadmin responde 403).

Ele mora na empresa **"Plataforma"**, criada pelo seed só para lhe dar um
`empresa_id` — ela não tem dado operacional.

Duas rotas aceitam o superadmin por `usuarios.gerenciar` e o admin da empresa
por `usuarios.ver`/`usuarios.aprovar`, via `requer_qualquer(...)`:
`GET /usuarios` e `PATCH /usuarios/{id}/aprovar`.

### 8.5 Endpoints de empresa

| Método | Rota | Quem pode |
|---|---|---|
| GET | `/empresas` | `empresas.gerenciar` (superadmin) |
| POST | `/empresas` | `empresas.gerenciar` |
| PATCH | `/empresas/{id}` | `empresas.gerenciar` |
| POST | `/empresas/{id}/regenerar-convite` | superadmin, ou admin da **própria** empresa |
| GET | `/empresas/minha` | qualquer logado — `codigoConvite` só sai para quem tem `usuarios.aprovar` |

### 8.6 Cadastro por convite

`POST /auth/registrar` recebe **`codigoConvite`** no lugar do antigo campo
`empresa`:

```json
{"username": "...", "cargo": "...", "codigoConvite": "ABCD2345WXYZ",
 "funcao": "...", "email": "...", "senha": "..."}
```

A empresa é resolvida pelo código (comparação sem espaços e sem caixa). Código
inexistente, ou de empresa desativada, devolve **400 com mensagem genérica** —
não dizemos qual dos dois casos ocorreu, nem confirmamos códigos por tentativa
e erro. O usuário nasce `ativo = false` na empresa do convite.

`PATCH /usuarios/{id}/aprovar` só funciona para **admin da mesma empresa** ou
superadmin; alvo de outra empresa devolve 404.

### 8.7 Seed

`python -m seeds.perfis_permissoes` cria:

- empresa **"Plataforma"** + `superadmin` (`SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD`);
- empresa **"Demo"** + o `admin` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`);
- e imprime o **código de convite da Demo** no final, para cadastrar os primeiros usuários.

É idempotente e nunca sobrescreve a senha de quem já existe.
