import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Send, Download } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";
type FilterTab = "all" | InvoiceStatus;

const invoices = [
  { id: "1", number: "INV-001", client: "Acme Corp", email: "billing@acme.com", amount: 4500, status: "paid" as const, date: "2026-03-12", dueDate: "2026-04-12" },
  { id: "2", number: "INV-002", client: "Globex Inc", email: "ap@globex.com", amount: 2800, status: "pending" as const, date: "2026-03-10", dueDate: "2026-04-10" },
  { id: "3", number: "INV-003", client: "Initech LLC", email: "finance@initech.com", amount: 6200, status: "overdue" as const, date: "2026-02-28", dueDate: "2026-03-28" },
  { id: "4", number: "INV-004", client: "Umbrella Co", email: "pay@umbrella.co", amount: 1900, status: "draft" as const, date: "2026-03-14", dueDate: "2026-04-14" },
  { id: "5", number: "INV-005", client: "Wayne Enterprises", email: "accounts@wayne.com", amount: 8750, status: "paid" as const, date: "2026-03-08", dueDate: "2026-04-08" },
  { id: "6", number: "INV-006", client: "Stark Industries", email: "billing@stark.com", amount: 3400, status: "pending" as const, date: "2026-03-11", dueDate: "2026-04-11" },
  { id: "7", number: "INV-007", client: "Oscorp", email: "finance@oscorp.net", amount: 5100, status: "paid" as const, date: "2026-03-05", dueDate: "2026-04-05" },
  { id: "8", number: "INV-008", client: "LexCorp", email: "ap@lexcorp.com", amount: 7600, status: "overdue" as const, date: "2026-02-20", dueDate: "2026-03-20" },
  { id: "9", number: "INV-009", client: "Daily Planet", email: "billing@dailyplanet.com", amount: 2100, status: "pending" as const, date: "2026-03-13", dueDate: "2026-04-13" },
  { id: "10", number: "INV-010", client: "Cyberdyne Systems", email: "pay@cyberdyne.ai", amount: 9300, status: "draft" as const, date: "2026-03-15", dueDate: "2026-04-15" },
];

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

const Invoices = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((inv) => {
    const matchesFilter = activeFilter === "all" || inv.status === activeFilter;
    const matchesSearch =
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client.toLowerCase().includes(search.toLowerCase());
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
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      }
    >
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
                <span className="ml-1.5 text-xs text-muted-foreground">({counts[tab.value]})</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-[240px] pl-9 text-sm" />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => (
              <TableRow key={inv.id} className="group">
                <TableCell className="font-medium text-foreground">{inv.number}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.client}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">${inv.amount.toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={inv.status} /></TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="gap-2 text-sm"><Eye className="h-3.5 w-3.5" /> View</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-sm"><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-sm"><Send className="h-3.5 w-3.5" /> Send</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-sm"><Download className="h-3.5 w-3.5" /> Download PDF</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-sm text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No invoices found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </DashboardLayout>
  );
};

export default Invoices;
