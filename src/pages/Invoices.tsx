import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Send, Download, X, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";
type FilterTab = "all" | InvoiceStatus;

type ClientObject = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

type Invoice = {
  id: string;
  client: ClientObject | string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
};

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

const getClientName = (client: ClientObject | string): string => {
  if (typeof client === "object") return client?.name ?? "";
  return client ?? "";
};

const getClientEmail = (client: ClientObject | string): string => {
  if (typeof client === "object") return client?.email ?? "";
  return "";
};

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<ClientObject[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    amount: "",
    status: "pending",
    dueDate: "",
  });

  useEffect(() => {
    Promise.all([
      apiGet<Invoice[]>("/api/clients/invoices"),
      apiGet<ClientObject[]>("/api/clients"),
    ])
        .then(([inv, cls]) => {
          setInvoices(inv);
          setClients(cls);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/clients/invoices/${id}`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const updated = await apiPatch<Invoice>(`/api/clients/invoices/${id}/paid`);
      setInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? { ...inv, status: "paid" } : inv))
      );
    } catch (err) {
      console.error("Mark paid failed:", err);
    }
  };

  const handleAddInvoice = async () => {
    if (!form.clientId || !form.amount || !form.dueDate) return;
    setSaving(true);
    try {
      const newInvoice = await apiPost<Invoice>(
          `/api/clients/${form.clientId}/invoices`,
          {
            amount: parseFloat(form.amount),
            status: form.status.toUpperCase(),
            dueDate: form.dueDate,
          }
      );
      setInvoices((prev) => [...prev, newInvoice]);
      setShowAddDialog(false);
      setForm({ clientId: "", amount: "", status: "pending", dueDate: "" });
    } catch (err) {
      console.error("Add invoice failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchesFilter = activeFilter === "all" || inv.status === activeFilter;
    const clientName = getClientName(inv.client);
    const matchesSearch =
        inv.id?.toString().toLowerCase().includes(search.toLowerCase()) ||
        clientName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: invoices.length,
    pending: invoices.filter((i) => i.status === "pending").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  return (
      <DashboardLayout
          title="Invoices"
          headerActions={
            <Button
                size="sm"
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          }
      >
        {/* Add Invoice Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                    type="number"
                    placeholder="e.g. 5000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                  onClick={handleAddInvoice}
                  disabled={saving || !form.clientId || !form.amount || !form.dueDate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? "Saving..." : "Create Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-border bg-card shadow-card"
        >
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-lg bg-secondary p-1">
              {filterTabs.map((tab) => (
                  <button
                      key={tab.value}
                      onClick={() => setActiveFilter(tab.value)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          activeFilter === tab.value
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                  ({counts[tab.value as keyof typeof counts] ?? 0})
                </span>
                  </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-[240px] pl-9 text-sm"
              />
            </div>
          </div>

          {error && (
              <div className="p-5 text-sm text-destructive">
                ⚠️ Failed to load invoices: {error}
              </div>
          )}

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading invoices...</TableCell>
                  </TableRow>
              ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No invoices found.</TableCell>
                  </TableRow>
              ) : (
                  filtered.map((inv) => (
                      <TableRow key={inv.id} className="group">
                        <TableCell className="font-medium text-foreground">#{inv.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-foreground">{getClientName(inv.client)}</p>
                            <p className="text-xs text-muted-foreground">{getClientEmail(inv.client)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">${inv.amount?.toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={inv.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem className="gap-2 text-sm"><Eye className="h-3.5 w-3.5" /> View</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-sm"><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-sm"><Send className="h-3.5 w-3.5" /> Send</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-sm"><Download className="h-3.5 w-3.5" /> Download PDF</DropdownMenuItem>
                              {inv.status !== "paid" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => handleMarkPaid(inv.id)}
                                        className="gap-2 text-sm text-green-600 font-medium"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" /> Mark as Paid
                                    </DropdownMenuItem>
                                  </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                  onClick={() => handleDelete(inv.id)}
                                  className="gap-2 text-sm text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      </DashboardLayout>
  );
};

export default Invoices;