import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { styles } from "./painel-admin.style";
import { ROUTES } from "@/constants/routes";
import { ApiError, api } from "@/services/api";
import { useAuth } from "@/context/auth-context";

type Empresa = {
  id: number;
  nome: string;
  cnpj?: string | null;
  codigoConvite?: string | null;
  ativo?: boolean;
  criadoEm?: string;
};

type EmpresaRef = {
  id: number;
  nome: string;
};

type Usuario = {
  id: number;
  username: string;
  email: string;
  cargo?: string | null;
  funcao?: string | null;
  perfil: string | null;
  perfilId?: number | null;
  permissoes?: string[];
  ativo: boolean;
  empresa: EmpresaRef;
  criadoEm?: string;
  ultimoLogin?: string | null;
};

type UsuarioModalItem = Usuario & {
  approve?: boolean;
};

type Perfil = {
  id: number;
  nome: string;
  descricao?: string | null;
  permissoes?: string[];
};

type Auditoria = {
  id: number;
  acao: string;
  tabela: string;
  registroId?: number | null;
  usuarioId?: number | null;
  criadoEm: string;
  detalhes?: unknown;
};

type Tab = "overview" | "empresas" | "usuarios" | "perfis" | "auditoria";

type ModalState =
  | {
      kind: "empresa";
      item?: Empresa;
    }
  | {
      kind: "usuario";
      item: UsuarioModalItem;
    }
  | {
      kind: "perfil";
      item?: Perfil;
    }
  | {
      kind: "permissoes";
      item: Perfil;
    }
  | {
      kind: "auditoria";
      item: Auditoria;
    }
  | null;

type StatusFilter = "todos" | "ativos" | "pendentes";

const PERMISSOES = [
  "ativos.ver",
  "ativos.criar",
  "ativos.editar",
  "ativos.deletar",
  "manutencoes.ver",
  "manutencoes.criar",
  "manutencoes.editar",
  "manutencoes.deletar",
  "planos.ver",
  "planos.criar",
  "planos.editar",
  "planos.deletar",
  "prestadores.ver",
  "prestadores.criar",
  "prestadores.editar",
  "prestadores.deletar",
  "pecas.ver",
  "pecas.criar",
  "pecas.editar",
  "pecas.deletar",
  "anexos.enviar",
  "anexos.deletar",
  "custos.ver",
  "relatorios.exportar",
  "dashboard.ver",
  "usuarios.ver",
  "usuarios.aprovar",
  "usuarios.gerenciar",
  "perfis.gerenciar",
  "auditoria.ver",
] as const;

function msg(e: unknown) {
  return e instanceof ApiError || e instanceof Error
    ? e.message
    : "Não foi possível concluir a operação.";
}

function date(v?: string | null) {
  if (!v) return "—";

  const d = new Date(v);

  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

function label(v?: string | null) {
  return v
    ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Sem perfil";
}

function Button({
  title,
  onPress,
  danger = false,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        danger
          ? styles.buttonDanger
          : secondary
            ? styles.buttonSecondary
            : styles.buttonPrimary,
        disabled && { opacity: 0.6 },
      ]}
    >
      <Text
        style={
          danger
            ? styles.buttonTextDanger
            : secondary
              ? styles.buttonTextDark
              : styles.buttonText
        }
      >
        {title}
      </Text>
    </Pressable>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "neutral" | "green" | "red" | "blue";
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === "green" && styles.badgeGreen,
        tone === "red" && styles.badgeRed,
        tone === "blue" && styles.badgeBlue,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          tone === "green" && styles.badgeGreenText,
          tone === "red" && styles.badgeRedText,
          tone === "blue" && styles.badgeBlueText,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

function Field({
  label: l,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{l}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function SysAdmin() {
  const { usuario, isAuthenticated, isCarregando, logout } = useAuth();

  const [tab, setTab] = useState<Tab>("overview");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [auditoria, setAuditoria] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [modal, setModal] = useState<ModalState>(null);

  const superadmin = usuario?.perfil === "superadmin";

  const load = useCallback(
    async (silent = false) => {
      if (!isAuthenticated || !superadmin) return;

      if (!silent) setLoading(true);

      setError(null);

      try {
        const [es, us, ps, au] = await Promise.all([
          api.get<Empresa[]>("/empresas"),
          api.get<Usuario[]>("/usuarios"),
          api.get<Perfil[]>("/perfis"),
          api.get<Auditoria[]>("/auditoria"),
        ]);

        setEmpresas(es);
        setUsuarios(us);
        setPerfis(ps);
        setAuditoria(au);
      } catch (e) {
        setError(msg(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, superadmin],
  );

  useEffect(() => {
    if (isCarregando) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    } else if (!superadmin) {
      router.replace(ROUTES.HOME);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  }, [isCarregando, isAuthenticated, superadmin, load]);

  const refresh = () => {
    setRefreshing(true);
    void load(true);
  };

  const filteredEmpresas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return empresas.filter((e) =>
      `${e.nome} ${e.cnpj ?? ""} ${e.id}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [empresas, search]);

  const filteredUsuarios = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return usuarios.filter((u) => {
      const q = `${u.username} ${u.email} ${
        u.empresa?.nome ?? ""
      } ${u.perfil ?? ""}`
        .toLowerCase()
        .includes(normalizedSearch);

      return (
        q &&
        (statusFilter === "todos" ||
          (statusFilter === "ativos" && u.ativo) ||
          (statusFilter === "pendentes" && !u.ativo))
      );
    });
  }, [usuarios, search, statusFilter]);

  if (isCarregando || loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingText}>
          Carregando painel administrativo...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated || !usuario || !superadmin) return null;

  const navigate = (next: Tab) => {
    setTab(next);
    setSearch("");
    setStatusFilter("todos");
  };

  const title = {
    overview: "Visão geral",
    empresas: "Empresas",
    usuarios: "Usuários",
    perfis: "Perfis e permissões",
    auditoria: "Auditoria",
  }[tab];

  const tabLabels: Record<Tab, string> = {
    overview: "Visão geral",
    empresas: "Empresas",
    usuarios: "Usuários",
    perfis: "Perfis e permissões",
    auditoria: "Auditoria",
  };

  return (
    <View style={styles.screen}>
      <View style={styles.layout}>
        <View style={styles.sidebar}>
          <Text style={styles.brand}>CMMS</Text>

          <Text style={styles.brandSub}>Administração da plataforma</Text>

          {(
            ["overview", "empresas", "usuarios", "perfis", "auditoria"] as Tab[]
          ).map((x) => (
            <Pressable
              key={x}
              onPress={() => navigate(x)}
              style={[styles.navButton, tab === x && styles.navButtonActive]}
            >
              <Text style={[styles.navText, tab === x && styles.navTextActive]}>
                {tabLabels[x]}
              </Text>
            </Pressable>
          ))}

          <View style={styles.sidebarBottom}>
            <View style={styles.userMini}>
              <Text style={styles.userName}>{usuario.username}</Text>

              <Text style={styles.userRole}>Superadministrador</Text>
            </View>

            <Pressable
              onPress={() => void logout()}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Sair</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            }
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{title}</Text>

                <Text style={styles.subtitle}>
                  Controle global da plataforma, tenants, usuários, perfis e
                  rastreabilidade.
                </Text>
              </View>

              <View style={styles.headerActions}>
                <Button
                  title="Atualizar"
                  secondary
                  disabled={refreshing}
                  onPress={refresh}
                />
              </View>
            </View>

            {error && (
              <View style={styles.error}>
                <Text style={styles.errorTitle}>Erro na operação</Text>

                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {tab === "overview" && (
              <Overview
                empresas={empresas}
                usuarios={usuarios}
                perfis={perfis}
                auditoria={auditoria}
                onTab={navigate}
              />
            )}

            {tab === "empresas" && (
              <Empresas
                items={filteredEmpresas}
                search={search}
                setSearch={setSearch}
                onNew={() =>
                  setModal({
                    kind: "empresa",
                  })
                }
                onEdit={(x) =>
                  setModal({
                    kind: "empresa",
                    item: x,
                  })
                }
                onToggle={async (x) => {
                  try {
                    await api.patch(`/empresas/${x.id}`, {
                      ativo: !x.ativo,
                    });

                    await load(true);
                  } catch (e) {
                    setError(msg(e));
                  }
                }}
                onInvite={async (x) => {
                  try {
                    const r = await api.post<{
                      codigoConvite?: string;
                      codigo_convite?: string;
                    }>(`/empresas/${x.id}/regenerar-convite`);

                    setError(
                      `Novo convite: ${
                        r?.codigoConvite ??
                        r?.codigo_convite ??
                        "gerado com sucesso"
                      }`,
                    );

                    await load(true);
                  } catch (e) {
                    setError(msg(e));
                  }
                }}
              />
            )}

            {tab === "usuarios" && (
              <Usuarios
                items={filteredUsuarios}
                search={search}
                setSearch={setSearch}
                filter={statusFilter}
                setFilter={setStatusFilter}
                perfis={perfis}
                onEdit={(x) =>
                  setModal({
                    kind: "usuario",
                    item: x,
                  })
                }
                onApprove={(x) =>
                  setModal({
                    kind: "usuario",
                    item: {
                      ...x,
                      approve: true,
                    },
                  })
                }
              />
            )}

            {tab === "perfis" && (
              <Perfis
                items={perfis}
                onNew={() =>
                  setModal({
                    kind: "perfil",
                  })
                }
                onEdit={(x) =>
                  setModal({
                    kind: "perfil",
                    item: x,
                  })
                }
                onPermissions={(x) =>
                  setModal({
                    kind: "permissoes",
                    item: x,
                  })
                }
              />
            )}

            {tab === "auditoria" && (
              <AuditoriaView
                items={auditoria}
                search={search}
                setSearch={setSearch}
                onView={(x) =>
                  setModal({
                    kind: "auditoria",
                    item: x,
                  })
                }
              />
            )}
          </ScrollView>
        </View>
      </View>

      {modal?.kind === "empresa" && (
        <EmpresaModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void load(true);
          }}
        />
      )}

      {modal?.kind === "usuario" && (
        <UsuarioModal
          item={modal.item}
          perfis={perfis}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void load(true);
          }}
        />
      )}

      {modal?.kind === "perfil" && (
        <PerfilModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void load(true);
          }}
        />
      )}

      {modal?.kind === "permissoes" && (
        <PermissoesModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void load(true);
          }}
        />
      )}

      {modal?.kind === "auditoria" && (
        <AuditModal item={modal.item} onClose={() => setModal(null)} />
      )}
    </View>
  );
}

function Overview({
  empresas,
  usuarios,
  perfis,
  auditoria,
  onTab,
}: {
  empresas: Empresa[];
  usuarios: Usuario[];
  perfis: Perfil[];
  auditoria: Auditoria[];
  onTab: (x: Tab) => void;
}) {
  const ativos = empresas.filter((x) => x.ativo !== false).length;

  const users = usuarios.filter((x) => x.ativo).length;

  const pending = usuarios.filter((x) => !x.ativo).length;

  return (
    <>
      <View style={styles.metrics}>
        {[
          ["Empresas", empresas.length, `${ativos} ativas`],
          ["Usuários", usuarios.length, `${users} ativos`],
          ["Pendentes", pending, "aguardando aprovação"],
          ["Perfis", perfis.length, "perfis cadastrados"],
          ["Auditoria", auditoria.length, "registros disponíveis"],
        ].map(([a, b, c]) => (
          <View style={styles.metric} key={String(a)}>
            <Text style={styles.metricLabel}>{a}</Text>

            <Text style={styles.metricValue}>{b}</Text>

            <Text style={styles.metricHint}>{c}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ações rápidas</Text>

        <Text style={styles.sectionHint}>Administração global</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.rowTitle}>Criar nova empresa</Text>

            <Text style={styles.rowSub}>
              Cadastre um novo tenant para utilizar o CMMS.
            </Text>
          </View>

          <Button title="Nova empresa" onPress={() => onTab("empresas")} />
        </View>

        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.rowTitle}>Aprovar usuários</Text>

            <Text style={styles.rowSub}>
              Veja cadastros que ainda estão aguardando aprovação.
            </Text>
          </View>

          <Button
            title="Ver pendentes"
            secondary
            onPress={() => onTab("usuarios")}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.rowTitle}>Gerenciar permissões</Text>

            <Text style={styles.rowSub}>
              Configure os acessos de cada perfil.
            </Text>
          </View>

          <Button
            title="Abrir perfis"
            secondary
            onPress={() => onTab("perfis")}
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Atividade recente</Text>

        <Text style={styles.sectionHint}>Últimos 8 eventos</Text>
      </View>

      <View style={styles.panel}>
        {auditoria.slice(0, 8).map((a) => (
          <View style={styles.auditRow} key={a.id}>
            <View style={styles.rowMain}>
              <Text style={styles.auditAction}>
                {a.acao} · {a.tabela}
              </Text>

              <Text style={styles.auditDetail}>
                Registro #{a.registroId ?? "—"} · Usuário #{a.usuarioId ?? "—"}
              </Text>
            </View>

            <Text style={styles.rowMeta}>{date(a.criadoEm)}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function Empresas({
  items,
  search,
  setSearch,
  onNew,
  onEdit,
  onToggle,
  onInvite,
}: {
  items: Empresa[];
  search: string;
  setSearch: (v: string) => void;
  onNew: () => void;
  onEdit: (x: Empresa) => void;
  onToggle: (x: Empresa) => void;
  onInvite: (x: Empresa) => void;
}) {
  return (
    <>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome, CNPJ ou ID"
          placeholderTextColor="#94A3B8"
        />

        <Button title="Nova empresa" onPress={onNew} />
      </View>

      <View style={styles.panel}>
        {items.map((e) => (
          <View style={styles.row} key={e.id}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{e.nome}</Text>

              <Text style={styles.rowSub}>
                {e.cnpj || "CNPJ não informado"} · ID #{e.id}
              </Text>

              <Text style={styles.rowMeta}>
                Convite: {e.codigoConvite || "oculto"} · Criada:{" "}
                {date(e.criadoEm)}
              </Text>
            </View>

            <Badge tone={e.ativo === false ? "red" : "green"}>
              {e.ativo === false ? "Inativa" : "Ativa"}
            </Badge>

            <View style={styles.actions}>
              <Button title="Editar" secondary onPress={() => onEdit(e)} />

              <Button title="Convite" secondary onPress={() => onInvite(e)} />

              <Button
                title={e.ativo === false ? "Ativar" : "Desativar"}
                danger={e.ativo !== false}
                secondary={e.ativo === false}
                onPress={() => onToggle(e)}
              />
            </View>
          </View>
        ))}

        {!items.length && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma empresa encontrada.</Text>
          </View>
        )}
      </View>
    </>
  );
}

function Usuarios({
  items,
  search,
  setSearch,
  filter,
  setFilter,
  perfis,
  onEdit,
  onApprove,
}: {
  items: Usuario[];
  search: string;
  setSearch: (v: string) => void;
  filter: StatusFilter;
  setFilter: (v: StatusFilter) => void;
  perfis: Perfil[];
  onEdit: (x: Usuario) => void;
  onApprove: (x: Usuario) => void;
}) {
  return (
    <>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar usuário, e-mail, empresa ou perfil"
          placeholderTextColor="#94A3B8"
        />

        <Pressable
          style={[styles.filter, filter === "todos" && styles.filterActive]}
          onPress={() => setFilter("todos")}
        >
          <Text style={styles.filterText}>Todos</Text>
        </Pressable>

        <Pressable
          style={[styles.filter, filter === "ativos" && styles.filterActive]}
          onPress={() => setFilter("ativos")}
        >
          <Text style={styles.filterText}>Ativos</Text>
        </Pressable>

        <Pressable
          style={[styles.filter, filter === "pendentes" && styles.filterActive]}
          onPress={() => setFilter("pendentes")}
        >
          <Text style={styles.filterText}>Pendentes</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        {items.map((u) => (
          <View style={styles.row} key={u.id}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{u.username}</Text>

              <Text style={styles.rowSub}>
                {u.email} · {u.empresa?.nome}
              </Text>

              <Text style={styles.rowMeta}>
                {label(u.perfil)} · {u.cargo || "Cargo não informado"} ·
                Cadastro {date(u.criadoEm)}
              </Text>
            </View>

            <Badge tone={u.ativo ? "green" : "red"}>
              {u.ativo ? "Ativo" : "Pendente"}
            </Badge>

            <View style={styles.actions}>
              {!u.ativo && (
                <Button title="Aprovar" onPress={() => onApprove(u)} />
              )}

              <Button title="Editar" secondary onPress={() => onEdit(u)} />
            </View>
          </View>
        ))}

        {!items.length && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
          </View>
        )}
      </View>
    </>
  );
}

function Perfis({
  items,
  onNew,
  onEdit,
  onPermissions,
}: {
  items: Perfil[];
  onNew: () => void;
  onEdit: (x: Perfil) => void;
  onPermissions: (x: Perfil) => void;
}) {
  return (
    <>
      <View style={styles.toolbar}>
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>Perfis do sistema</Text>

          <Text style={styles.rowSub}>
            Atribua somente as permissões necessárias a cada função.
          </Text>
        </View>

        <Button title="Novo perfil" onPress={onNew} />
      </View>

      <View style={styles.panel}>
        {items.map((p) => (
          <View style={styles.row} key={p.id}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{label(p.nome)}</Text>

              <Text style={styles.rowSub}>
                {p.descricao || "Sem descrição"}
              </Text>

              <Text style={styles.rowMeta}>
                {p.permissoes?.length ?? 0} permissões · ID #{p.id}
              </Text>
            </View>

            <View style={styles.actions}>
              <Button title="Permissões" onPress={() => onPermissions(p)} />

              <Button title="Editar" secondary onPress={() => onEdit(p)} />
            </View>
          </View>
        ))}

        {!items.length && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum perfil encontrado.</Text>
          </View>
        )}
      </View>
    </>
  );
}

function AuditoriaView({
  items,
  search,
  setSearch,
  onView,
}: {
  items: Auditoria[];
  search: string;
  setSearch: (v: string) => void;
  onView: (x: Auditoria) => void;
}) {
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = items.filter((a) =>
    `${a.acao} ${a.tabela} ${a.registroId ?? ""} ${a.usuarioId ?? ""}`
      .toLowerCase()
      .includes(normalizedSearch),
  );

  return (
    <>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar ação, tabela, usuário ou registro"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.panel}>
        {filtered.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => onView(a)}
            style={styles.auditRow}
          >
            <View style={styles.rowMain}>
              <Text style={styles.auditAction}>
                {a.acao} · {a.tabela}
              </Text>

              <Text style={styles.auditDetail}>
                Registro #{a.registroId ?? "—"} · Usuário #{a.usuarioId ?? "—"}
              </Text>
            </View>

            <Text style={styles.rowMeta}>{date(a.criadoEm)}</Text>
          </Pressable>
        ))}

        {!filtered.length && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
          </View>
        )}
      </View>
    </>
  );
}

function EmpresaModal({
  item,
  onClose,
  onSaved,
}: {
  item?: Empresa;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(item?.nome ?? "");
  const [cnpj, setCnpj] = useState(item?.cnpj ?? "");
  const [codigoConvite, setCodigoConvite] = useState(item?.codigoConvite ?? "");
  const [ativo, setAtivo] = useState(item?.ativo !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      if (!nome.trim()) {
        throw new Error("Informe o nome da empresa.");
      }

      const body = {
        nome: nome.trim(),
        cnpj: cnpj.trim() || null,
        codigoConvite: codigoConvite.trim() || null,
        ativo,
      };

      if (item) {
        await api.patch(`/empresas/${item.id}`, body);
      } else {
        await api.post("/empresas", body);
      }

      onSaved();
    } catch (e) {
      setError(msg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {item ? "Editar empresa" : "Nova empresa"}
            </Text>

            <Pressable onPress={onClose}>
              <Text style={styles.close}>X</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <Field
              label="Nome"
              value={nome}
              onChangeText={setNome}
              placeholder="Razão ou nome da empresa"
            />

            <Field
              label="CNPJ"
              value={cnpj}
              onChangeText={setCnpj}
              placeholder="00.000.000/0000-00"
            />

            <Field
              label="Cód. Convite"
              value={codigoConvite}
              onChangeText={setCodigoConvite}
              placeholder="123456"
            />

            <Text style={styles.label}>Status</Text>

            <View style={styles.selectRow}>
              <Pressable
                onPress={() => setAtivo(true)}
                style={[styles.select, ativo && styles.selectActive]}
              >
                <Text
                  style={[styles.selectText, ativo && styles.selectTextActive]}
                >
                  Ativa
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setAtivo(false)}
                style={[styles.select, !ativo && styles.selectActive]}
              >
                <Text
                  style={[styles.selectText, !ativo && styles.selectTextActive]}
                >
                  Inativa
                </Text>
              </Pressable>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              secondary
              disabled={saving}
              onPress={onClose}
            />

            <Button
              title={saving ? "Salvando..." : "Salvar"}
              disabled={saving}
              onPress={() => void save()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function UsuarioModal({
  item,
  perfis,
  onClose,
  onSaved,
}: {
  item: UsuarioModalItem;
  perfis: Perfil[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(item.username ?? "");
  const [email, setEmail] = useState(item.email ?? "");
  const [cargo, setCargo] = useState(item.cargo ?? "");
  const [funcao, setFuncao] = useState(item.funcao ?? "");

  const [perfilId, setPerfilId] = useState<number | undefined>(
    item.perfilId ?? perfis.find((p) => p.nome === item.perfil)?.id,
  );

  const [ativo, setAtivo] = useState(item.ativo);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const approve = item.approve === true;

  const save = async () => {
    if (saving) {
      console.log("[UsuarioModal] Salvamento já em andamento.");
      return;
    }

    console.log("[UsuarioModal] Iniciando salvamento...");
    console.log("[UsuarioModal] Usuário:", item.id);
    console.log("[UsuarioModal] Aprovação:", approve);
    console.log("[UsuarioModal] Perfil:", perfilId);
    console.log("[UsuarioModal] Username:", username);
    console.log("[UsuarioModal] Email:", email);
    console.log("[UsuarioModal] Cargo:", cargo);
    console.log("[UsuarioModal] Função:", funcao);
    console.log("[UsuarioModal] Ativo:", ativo);

    setSaving(true);
    setError("");

    try {
      if (!perfilId) {
        console.log("[UsuarioModal] Erro: nenhum perfil selecionado.");
        throw new Error("Selecione um perfil.");
      }

      if (approve) {
        const payload = {
          perfilId,
        };

        console.log(
          "[UsuarioModal] Enviando aprovação:",
          `/usuarios/${item.id}/aprovar`,
          payload,
        );

        const resposta = await api.patch(
          `/usuarios/${item.id}/aprovar`,
          payload,
        );

        console.log("[UsuarioModal] Resposta da aprovação:", resposta);
      } else {
        const payload = {
          username: username.trim(),
          email: email.trim(),
          cargo: cargo.trim() || null,
          funcao: funcao.trim() || null,
          perfilId,
          ativo,
        };

        console.log(
          "[UsuarioModal] Enviando atualização:",
          `/usuarios/${item.id}`,
        );

        console.log("[UsuarioModal] Payload:", payload);

        const resposta = await api.patch(`/usuarios/${item.id}`, payload);

        console.log("[UsuarioModal] Resposta da API:", resposta);
      }

      console.log("[UsuarioModal] Salvamento concluído.");

      onSaved();
    } catch (e) {
      console.error("[UsuarioModal] Erro ao salvar usuário:", e);

      const mensagem = msg(e);

      console.error("[UsuarioModal] Mensagem exibida:", mensagem);

      setError(mensagem);
    } finally {
      console.log("[UsuarioModal] Finalizando salvamento.");

      setSaving(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {approve ? "Aprovar usuário" : "Editar usuário"}
            </Text>

            <Pressable onPress={onClose}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            {!approve && (
              <>
                <Field
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                />

                <Field label="E-mail" value={email} onChangeText={setEmail} />

                <Field label="Cargo" value={cargo} onChangeText={setCargo} />

                <Field label="Função" value={funcao} onChangeText={setFuncao} />
              </>
            )}

            <Text style={styles.label}>Perfil</Text>

            <View style={styles.selectRow}>
              {perfis.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setPerfilId(p.id)}
                  style={[
                    styles.select,
                    perfilId === p.id && styles.selectActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectText,
                      perfilId === p.id && styles.selectTextActive,
                    ]}
                  >
                    {label(p.nome)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {!approve && (
              <>
                <Text style={[styles.label, { marginTop: 14 }]}>Status</Text>

                <View style={styles.selectRow}>
                  <Pressable
                    onPress={() => setAtivo(true)}
                    style={[styles.select, ativo && styles.selectActive]}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        ativo && styles.selectTextActive,
                      ]}
                    >
                      Ativo
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setAtivo(false)}
                    style={[styles.select, !ativo && styles.selectActive]}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !ativo && styles.selectTextActive,
                      ]}
                    >
                      Inativo
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              secondary
              disabled={saving}
              onPress={onClose}
            />

            <Button
              title={saving ? "Salvando..." : approve ? "Aprovar" : "Salvar"}
              disabled={saving}
              onPress={() => {
                console.log("[UsuarioModal] Botão Salvar pressionado.");
                void save();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PerfilModal({
  item,
  onClose,
  onSaved,
}: {
  item?: Perfil;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(item?.nome ?? "");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      if (!nome.trim()) {
        throw new Error("Informe o nome do perfil.");
      }

      if (item) {
        await api.patch(`/perfis/${item.id}`, {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
        });
      } else {
        await api.post("/perfis", {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
        });
      }

      onSaved();
    } catch (e) {
      setError(msg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {item ? "Editar perfil" : "Novo perfil"}
            </Text>

            <Pressable onPress={onClose}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Field label="Nome" value={nome} onChangeText={setNome} />

            <Field
              label="Descrição"
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />

            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              secondary
              disabled={saving}
              onPress={onClose}
            />

            <Button
              title={saving ? "Salvando..." : "Salvar"}
              disabled={saving}
              onPress={() => void save()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PermissoesModal({
  item,
  onClose,
  onSaved,
}: {
  item: Perfil;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(item.permissoes ?? []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const save = async () => {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      await api.patch(`/perfis/${item.id}/permissoes`, {
        permissoes: selected,
      });

      onSaved();
    } catch (e) {
      setError(msg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                Permissões · {label(item.nome)}
              </Text>

              <Text style={styles.rowMeta}>{selected.length} selecionadas</Text>
            </View>

            <Pressable onPress={onClose}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.permissionGrid}>
              {PERMISSOES.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => toggle(p)}
                  style={[
                    styles.permission,
                    selected.includes(p) && styles.permissionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.permissionText,
                      selected.includes(p) && styles.permissionTextActive,
                    ]}
                  >
                    {selected.includes(p) ? "✓ " : ""}
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              secondary
              disabled={saving}
              onPress={onClose}
            />

            <Button
              title={saving ? "Salvando..." : "Salvar permissões"}
              disabled={saving}
              onPress={() => void save()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AuditModal({
  item,
  onClose,
}: {
  item: Auditoria;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalhes da auditoria</Text>

            <Pressable onPress={onClose}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.label}>Ação</Text>

            <Text style={styles.rowTitle}>{item.acao}</Text>

            <Text style={styles.label}>Tabela</Text>

            <Text style={styles.rowSub}>{item.tabela}</Text>

            <Text style={styles.label}>Registro</Text>

            <Text style={styles.rowSub}>#{item.registroId ?? "—"}</Text>

            <Text style={styles.label}>Usuário</Text>

            <Text style={styles.rowSub}>#{item.usuarioId ?? "—"}</Text>

            <Text style={styles.label}>Data</Text>

            <Text style={styles.rowSub}>{date(item.criadoEm)}</Text>

            <Text style={styles.label}>Detalhes</Text>

            <Text selectable style={styles.rowSub}>
              {item.detalhes
                ? JSON.stringify(item.detalhes, null, 2)
                : "Nenhum detalhe adicional."}
            </Text>
          </View>

          <View style={styles.modalFooter}>
            <Button title="Fechar" secondary onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
