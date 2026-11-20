import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useTheme } from "@/hooks/useTheme";
import { createClient, deleteClient, getClients, type Client as ApiClient } from "@/lib/clients";
import { apiGet, ApiError } from "@/lib/api";
import { toast } from "sonner";

type ClientStatus = "active" | "inactive" | "lead";
type ViewMode = "grid" | "list";

type Client = {
  id: number;
  name: string;
  initials: string;
  company: string;
  email: string;
  phone: string;
  status: ClientStatus;
  totalBilled: number;
  totalPaid: number;
  openInvoices: number;
  projects: number;
  since: string;
  avatarColor: string;
};

type NewClientForm = {
  name: string;
  email: string;
  phone: string;
};

type ApiInvoice = {
  id: number;
  amount: number;
  status: string;
  clientId?: number;
  clientName?: string;
};

type ApiProject = {
  id: number;
  client?: {
    id: number;
    name: string;
  };
};

const STATUS_CONFIG: Record<ClientStatus, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: "Active", dot: "#5DCAA5", bg: "rgba(93,202,165,0.12)", text: "#5DCAA5" },
  inactive: { label: "Inactive", dot: "#E05252", bg: "rgba(224,82,82,0.12)", text: "#E05252" },
  lead: { label: "Lead", dot: "#F0C060", bg: "rgba(240,192,96,0.12)", text: "#c9a040" },
};

const AVATAR_COLORS = ["#5DCAA5", "#378ADD", "#E05252", "#F0C060", "#A78BFA", "#FB923C"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function toInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function toCompany(email: string) {
  const domain = email.split("@")[1] ?? "client.com";
  const base = domain.split(".")[0] ?? "client";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function mapApiClient(client: ApiClient): Client {
  const normalizedPhone = client.phone?.trim() || "-";
  return {
    id: client.id,
    name: client.name,
    initials: toInitials(client.name),
    company: toCompany(client.email),
    email: client.email,
    phone: normalizedPhone,
    status: normalizedPhone === "-" ? "lead" : "active",
    totalBilled: 0,
    totalPaid: 0,
    openInvoices: 0,
    projects: 0,
    since: new Date().toISOString().slice(0, 10),
    avatarColor: AVATAR_COLORS[client.id % AVATAR_COLORS.length],
  };
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: cfg.bg, fontSize: 12, fontWeight: 500, color: cfg.text, letterSpacing: "0.02em" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  const bg = color + "22";
  const border = color + "44";
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.28, fontWeight: 700, color, letterSpacing: "0.04em", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function MetricCard({ label, value, sub, accent, dark }: { label: string; value: string; sub?: string; accent?: string; dark: boolean }) {
  return (
    <div style={{ background: dark ? "#111111" : "#f8f8f8", border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`, borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: dark ? "#555" : "#999", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 600, color: accent ?? (dark ? "#e8e8e8" : "#111"), lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: dark ? "#444" : "#bbb" }}>{sub}</span>}
    </div>
  );
}

function FilterTab({ label, count, active, onClick, dark }: { label: string; count: number; active: boolean; onClick: () => void; dark: boolean }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: active ? "1px solid rgba(93,202,165,0.4)" : `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`, background: active ? "rgba(93,202,165,0.1)" : dark ? "transparent" : "#fafafa", color: active ? "#5DCAA5" : dark ? "#666" : "#888", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}>
      {label}
      <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 999, background: active ? "rgba(93,202,165,0.2)" : dark ? "#222" : "#eee", color: active ? "#5DCAA5" : dark ? "#555" : "#aaa" }}>{count}</span>
    </button>
  );
}

function ClientCard({ client, dark, onClick, onDelete }: { client: Client; dark: boolean; onClick: () => void; onDelete: () => void }) {
  const border = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const cardBg = dark ? "#111111" : "#ffffff";
  const textPrimary = dark ? "#e0e0e0" : "#111";
  const textMuted = dark ? "#555" : "#aaa";

  const outstanding = client.totalBilled - client.totalPaid;

  return (
    <div
      onClick={onClick}
      style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "20px", cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 16 }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)"; (e.currentTarget as HTMLElement).style.background = dark ? "#141414" : "#fafafa"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.background = cardBg; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar initials={client.initials} color={client.avatarColor} size={44} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: textPrimary }}>{client.name}</div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{client.company}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusBadge status={client.status} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{ border: `1px solid ${border}`, background: "transparent", color: dark ? "#c7c7c7" : "#333", borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 12, color: textMuted, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ opacity: 0.5 }}>✉</span>
          <span style={{ color: dark ? "#888" : "#555" }}>{client.email}</span>
        </div>
        <div style={{ fontSize: 12, color: textMuted, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ opacity: 0.5 }}>✆</span>
          <span style={{ color: dark ? "#888" : "#555" }}>{client.phone}</span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${border}` }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Billed</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#5DCAA5", fontVariantNumeric: "tabular-nums" }}>{fmt(client.totalBilled)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Due</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: outstanding > 0 ? "#F0C060" : textMuted, fontVariantNumeric: "tabular-nums" }}>{fmt(outstanding)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Projects</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>{client.projects}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: textMuted }}>Since {fmtDate(client.since)}</span>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState<NewClientForm>({ name: "", email: "", phone: "" });
  const [filter, setFilter] = useState<"all" | ClientStatus>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  async function loadClients() {
    setLoading(true);
    try {
      const [clientData, invoiceData, projectData] = await Promise.all([
        getClients(),
        apiGet<ApiInvoice[]>("/api/clients/invoices"),
        apiGet<ApiProject[]>("/api/projects"),
      ]);

      const invoiceAgg = new Map<number, { billed: number; paid: number; openInvoices: number }>();
      for (const inv of invoiceData) {
        const clientId = inv.clientId;
        if (!clientId) continue;
        const current = invoiceAgg.get(clientId) ?? { billed: 0, paid: 0, openInvoices: 0 };
        const amount = Number(inv.amount || 0);
        const status = String(inv.status || "").toUpperCase();

        current.billed += amount;
        if (status === "PAID") {
          current.paid += amount;
        } else {
          current.openInvoices += 1;
        }
        invoiceAgg.set(clientId, current);
      }

      const projectCounts = new Map<number, number>();
      for (const project of projectData) {
        const clientId = project.client?.id;
        if (!clientId) continue;
        projectCounts.set(clientId, (projectCounts.get(clientId) ?? 0) + 1);
      }

      setClients(
        clientData.map((c) => {
          const mapped = mapApiClient(c);
          const inv = invoiceAgg.get(c.id);
          mapped.totalBilled = inv?.billed ?? 0;
          mapped.totalPaid = inv?.paid ?? 0;
          mapped.openInvoices = inv?.openInvoices ?? 0;
          mapped.projects = projectCounts.get(c.id) ?? 0;
          return mapped;
        })
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchStatus = filter === "all" || c.status === filter;
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [clients, filter, search]);

  const counts = {
    all: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
    lead: clients.filter((c) => c.status === "lead").length,
  };

  const totalBilled = clients.reduce((s, c) => s + c.totalBilled, 0);
  const totalOutstanding = clients.reduce((s, c) => s + (c.totalBilled - c.totalPaid), 0);

  const border = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)";
  const textPrimary = dark ? "#ffffff" : "#111";
  const textMuted = dark ? "#a1a1aa" : "#71717a";
  const cardBg = dark ? "#111111" : "#f8f8f8";
  const rowHover = dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";

  const iconBtnStyle = (active: boolean) => ({
    width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: active ? "1px solid rgba(93,202,165,0.4)" : `1px solid ${border}`, background: active ? "rgba(93,202,165,0.1)" : "transparent", color: active ? "#5DCAA5" : textMuted, fontSize: 14, transition: "all 0.15s",
  });

  async function handleCreateClient() {
    if (!form.name.trim()) {
      toast.error("Client name is required.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Client email is required.");
      return;
    }

    setCreating(true);
    try {
      const created = await createClient({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setClients((prev) => [mapApiClient(created), ...prev]);
      setShowCreate(false);
      setForm({ name: "", email: "", phone: "" });
      toast.success("Client added.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add client.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteClient(id: number) {
    if (!window.confirm("Delete this client?")) return;

    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("Client deleted.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const confirmed = window.confirm(
          "This client has linked invoices or projects. Delete client and all linked invoices/projects?"
        );
        if (!confirmed) return;

        try {
          await deleteClient(id, true);
          setClients((prev) => prev.filter((c) => c.id !== id));
          toast.success("Client and linked records deleted.");
          return;
        } catch (forceErr) {
          const forceMessage = forceErr instanceof ApiError ? forceErr.message : "Failed to force delete client.";
          toast.error(forceMessage);
          return;
        }
      }

      const message = err instanceof ApiError ? err.message : "Failed to delete client.";
      toast.error(message);
    }
  }

  return (
    <DashboardLayout
      title="Clients"
      subtitle={`${counts.active} active · ${counts.lead} leads`}
      headerActions={
        <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#5DCAA5", border: "none", color: "#000", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Add Client
        </button>
      }
    >
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 480, background: dark ? "#121212" : "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: textPrimary }}>Add Client</h3>
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" style={{ background: dark ? "#0f0f0f" : "#fff", border: `1px solid ${border}`, color: textPrimary, borderRadius: 8, padding: "10px 12px", fontSize: 14 }} />
              <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" style={{ background: dark ? "#0f0f0f" : "#fff", border: `1px solid ${border}`, color: textPrimary, borderRadius: 8, padding: "10px 12px", fontSize: 14 }} />
              <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" style={{ background: dark ? "#0f0f0f" : "#fff", border: `1px solid ${border}`, color: textPrimary, borderRadius: 8, padding: "10px 12px", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowCreate(false)} style={{ border: `1px solid ${border}`, background: "transparent", color: textPrimary, borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => void handleCreateClient()} disabled={creating} style={{ border: "none", background: "#5DCAA5", color: "#000", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1 }}>{creating ? "Adding..." : "Add Client"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <MetricCard dark={dark} label="Total Clients" value={String(clients.length)} sub={`${counts.active} active`} accent="#5DCAA5" />
        <MetricCard dark={dark} label="Total Billed" value={fmt(totalBilled)} sub="all time" />
        <MetricCard dark={dark} label="Outstanding" value={fmt(totalOutstanding)} sub="across all clients" accent={totalOutstanding > 0 ? "#F0C060" : undefined} />
        <MetricCard dark={dark} label="Leads" value={String(counts.lead)} sub="to convert" />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "active", "inactive", "lead"] as const).map((f) => (
            <FilterTab key={f} dark={dark} label={f === "all" ? "All" : STATUS_CONFIG[f].label} count={counts[f]} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${border}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, color: textPrimary, outline: "none", width: 190 }}
          />
          <button style={iconBtnStyle(view === "grid")} onClick={() => setView("grid")} title="Grid view">⊞</button>
          <button style={iconBtnStyle(view === "list")} onClick={() => setView("list")} title="List view">☰</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: textMuted, fontSize: 13 }}>Loading clients...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: textMuted, fontSize: 13 }}>No clients match your filters.</div>
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, alignContent: "start" }}>
          {filtered.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              dark={dark}
              onClick={() => navigate(`/clients/${c.id}`)}
              onDelete={() => void handleDeleteClient(c.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, fontSize: 11, color: textMuted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${border}` }}>Client</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, fontSize: 11, color: textMuted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${border}` }}>Company</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, fontSize: 11, color: textMuted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${border}` }}>Email</th>
                <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 500, fontSize: 11, color: textMuted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${border}` }}>Status</th>
                <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 500, fontSize: 11, color: textMuted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${border}` }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/clients/${c.id}`)}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : "none", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = rowHover)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar initials={c.initials} color={c.avatarColor} size={32} />
                      <span style={{ fontWeight: 600, color: textPrimary }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}><span style={{ color: dark ? "#888" : "#555" }}>{c.company}</span></td>
                  <td style={{ padding: "13px 16px" }}><span style={{ color: textMuted, fontSize: 12 }}>{c.email}</span></td>
                  <td style={{ padding: "13px 16px", textAlign: "center" }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: "13px 16px", textAlign: "center" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteClient(c.id);
                      }}
                      style={{ border: `1px solid ${border}`, background: "transparent", color: textPrimary, borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: `1px solid ${border}`, padding: "10px 20px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: textMuted }}>{filtered.length} of {clients.length} clients</span>
            <span style={{ fontSize: 12, color: textMuted }}>Total billed: <span style={{ color: textPrimary, fontWeight: 600 }}>{fmt(filtered.reduce((s, c) => s + c.totalBilled, 0))}</span></span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
