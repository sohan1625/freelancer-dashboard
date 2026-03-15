import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Clock, AlertTriangle, Plus, Search,
  MoreHorizontal, Eye, Pencil, Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiGet, apiDelete } from "@/lib/api";

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
  number: string;
  client: ClientObject | string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
};

type Analytics = {
  totalInvoices: number;
  paid: number;
  pending: number;
  overdue: number;
  revenueCollected: number;
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

const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<Invoice[]>("/api/clients/invoices"),
      apiGet<Analytics>("/api/analytics"),
    ])
        .then(([inv, ana]) => {
          setInvoices(inv);
          setAnalytics(ana);
        })
        .catch(console.error)
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

  const filtered = invoices.filter((inv) => {
    const matchesFilter = activeFilter === "all" || inv.status === activeFilter;
    const clientName = getClientName(inv.client);
    const matchesSearch =
        inv.id?.toString().toLowerCase().includes(search.toLowerCase()) ||
        clientName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
      <DashboardLayout title="Invoices Dashboard">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnalyticsCard
              title="Total Received"
              value={loading ? "..." : `$${analytics?.revenueCollected?.toLocaleString() ?? 0}`}
              change="Revenue from paid invoices"
              changeType="positive"
              icon={DollarSign}
              delay={0}
          />
          <AnalyticsCard
              title="Pending Payments"
              value={loading ? "..." : `${analytics?.pending ?? 0} invoices`}
              change="Awaiting payment"
              changeType="neutral"
              icon={Clock}
              delay={0.1}
          />
          <AnalyticsCard
              title="Overdue Invoices"
              value={loading ? "..." : `${analytics?.overdue ?? 0} invoices`}
              change="Requires attention"
              changeType="negative"
              icon={AlertTriangle}
              delay={0.2}
          />
        </div>

        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6 rounded-xl border border-border bg-card shadow-card"
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
                  </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-[200px] pl-9 text-sm" />
              </div>
              <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" /> New Invoice
              </Button>
            </div>
          </div>

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
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
              ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No invoices found.</TableCell>
                  </TableRow>
              ) : (
                  filtered.map((inv) => (
                      <TableRow key={inv.id} className="group">
                        <TableCell className="font-medium text-foreground">#{inv.id}</TableCell>
                        <TableCell className="text-muted-foreground">{getClientName(inv.client)}</TableCell>
                        <TableCell className="font-medium text-foreground">${inv.amount?.toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={inv.status} /></TableCell>
                        <TableCell className="text-muted-foreground">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem className="gap-2 text-sm"><Eye className="h-3.5 w-3.5" /> View</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-sm"><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(inv.id)} className="gap-2 text-sm text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
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

export default Index;