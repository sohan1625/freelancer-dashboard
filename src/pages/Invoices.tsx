import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, CheckCircle, Download, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ds, tk, pill } from "@/lib/ds";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/api";
import { getClients, type Client as ApiClient } from "@/lib/clients";

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";

interface Invoice {
  id: string;
  number: string;
  client: string;
  clientInitials: string;
  amount: number;
  issued: string;
  due: string;
  status: InvoiceStatus;
}

interface NewInvoiceForm {
  clientId: string;
  amount: string;
  issueDate: string;
  dueDate: string;
  description: string;
}

type ApiInvoice = {
  id: number;
  amount: number;
  status: string;
  issueDate?: string;
  dueDate?: string;
  clientId?: number;
  clientName?: string;
};

const INITIAL_INVOICES: Invoice[] = [];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const dark = true;
  const p = pill(status, dark);
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
      style={{ backgroundColor: p.bg, color: p.text, borderColor: p.border }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function initialsFromName(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function InvoicesPage() {
  const ui = tk(true);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<NewInvoiceForm>({
    clientId: "",
    amount: "",
    issueDate: "",
    dueDate: "",
    description: "",
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const clientData = await getClients();
        setClients(clientData);

        const allInvoices = await apiGet<ApiInvoice[]>("/api/clients/invoices");
        const mappedInvoices: Invoice[] = allInvoices.map((inv) => {
          const clientName = inv.clientName || clientData.find((c) => c.id === inv.clientId)?.name || "Client";
          return {
            id: String(inv.id),
            number: `INV-${String(inv.id).padStart(3, "0")}`,
            client: clientName,
            clientInitials: initialsFromName(clientName),
            amount: Number(inv.amount),
            issued: inv.issueDate ?? "",
            due: inv.dueDate ?? "",
            status: String(inv.status || "PENDING").toLowerCase() as InvoiceStatus,
          };
        });

        mappedInvoices.sort((a, b) => Number(b.id) - Number(a.id));
        setInvoices(mappedInvoices);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const handleMarkAsPaid = async (id: string) => {
    try {
      await apiPatch(`/api/clients/invoices/${id}/paid`);
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: "paid" } : inv)));
      toast.success("Invoice updated to Paid");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update invoice.");
    } finally {
      setActiveMenu(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/clients/invoices/${id}`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success("Invoice deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete invoice.");
    } finally {
      setActiveMenu(null);
    }
  };

  const handleCreateInvoice = async () => {
    if (!form.clientId) {
      toast.error("Select a client.");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!form.issueDate || !form.dueDate) {
      toast.error("Issue and due date are required.");
      return;
    }

    setCreating(true);
    try {
      const created = await apiPost<{ id: number; amount: number; status: string; issueDate: string; dueDate: string }>(
        `/api/clients/${form.clientId}/invoices`,
        {
          amount: Number(form.amount),
          issueDate: form.issueDate,
          dueDate: form.dueDate,
          description: form.description.trim() || undefined,
          status: "PENDING",
        }
      );

      const client = clients.find((c) => String(c.id) === form.clientId);
      const nextInvoice: Invoice = {
        id: String(created.id),
        number: `INV-${String(created.id).padStart(3, "0")}`,
        client: client?.name ?? "Client",
        clientInitials: initialsFromName(client?.name ?? "Client"),
        amount: Number(created.amount),
        issued: created.issueDate,
        due: created.dueDate,
        status: String(created.status).toLowerCase() as InvoiceStatus,
      };

      setInvoices((prev) => [nextInvoice, ...prev]);
      setShowCreate(false);
      setForm({ clientId: "", amount: "", issueDate: "", dueDate: "", description: "" });
      toast.success("Invoice created.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create invoice.");
    } finally {
      setCreating(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchStatus = filter === "all" || inv.status === filter;
    const q = search.toLowerCase();
    return matchStatus && (!q || inv.client.toLowerCase().includes(q) || inv.number.toLowerCase().includes(q));
  });

  return (
    <DashboardLayout title="Invoices">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`${ds.font["2xl"]} ${ds.weight.semibold} ${ui.primary}`}>Invoices</h1>
          <p className={`${ds.font.sm} ${ui.muted}`}>Manage your billing and collections</p>
        </div>
        <Button className={ui.btnPrimary} onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Invoice
        </Button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111] border border-[rgba(255,255,255,0.12)] rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Create Invoice</h2>

            <div className="space-y-3">
              <select
                value={form.clientId}
                onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                className={ui.input}
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className={ui.input}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, issueDate: e.target.value }))}
                  className={ui.input}
                />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className={ui.input}
                />
              </div>

              <input
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className={ui.input}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => void handleCreateInvoice()} disabled={creating} className={ui.btnPrimary}>
                {creating ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={`${ui.card} overflow-visible`}>
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center">
          <div className="flex gap-2">
            {["all", "paid", "pending", "overdue"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as InvoiceStatus | "all")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${filter === f ? "bg-[#222] text-white" : ui.muted + " hover:text-white"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search invoices..."
              className={ui.input + " pl-9 w-64"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-[11px] uppercase tracking-wider ${ui.muted} border-b ${ui.divider}`}>
              <th className="p-4 font-medium">Invoice</th>
              <th className="p-4 font-medium">Client</th>
              <th className="p-4 font-medium text-right">Amount</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-sm text-gray-400" colSpan={5}>Loading invoices...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-4 text-sm text-gray-400" colSpan={5}>No invoices found.</td>
              </tr>
            ) : (
              <AnimatePresence>
                {filtered.map((inv) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`border-b ${ui.divider} last:border-0 hover:bg-[rgba(255,255,255,0.02)] relative`}
                >
                  <td className="p-4 font-mono text-xs text-white">{inv.number}</td>
                  <td className="p-4 text-sm text-gray-300">{inv.client}</td>
                  <td className="p-4 text-sm font-semibold text-right text-white">{fmt(inv.amount)}</td>
                  <td className="p-4 text-center"><StatusBadge status={inv.status} /></td>
                  <td className="p-4 text-right relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === inv.id ? null : inv.id)}
                      className="p-1 hover:bg-[#222] rounded-md transition-colors text-gray-500 hover:text-white"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {activeMenu === inv.id && (
                      <div className="absolute right-4 top-12 z-[100] w-44 bg-[#0f0f0f] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl p-1 text-left">
                        <button
                          onClick={() => void handleMarkAsPaid(inv.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#1a1a1a] hover:text-[#5DCAA5] rounded-md"
                        >
                          <CheckCircle size={14} /> Mark as Paid
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#1a1a1a] hover:text-white rounded-md">
                          <Download size={14} /> Download PDF
                        </button>
                        <div className="h-px bg-[rgba(255,255,255,0.06)] my-1" />
                        <button
                          onClick={() => void handleDelete(inv.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#F05252] hover:bg-[rgba(240,82,82,0.1)] rounded-md"
                        >
                          <Trash2 size={14} /> Delete Invoice
                        </button>
                      </div>
                    )}
                  </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
