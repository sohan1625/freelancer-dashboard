import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";
type FilterTab = "all" | InvoiceStatus;

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
}

const invoices: Invoice[] = [
  { id: "1", number: "INV-001", client: "Acme Corp", amount: 4500, status: "paid", date: "2026-03-12" },
  { id: "2", number: "INV-002", client: "Globex Inc", amount: 2800, status: "pending", date: "2026-03-10" },
  { id: "3", number: "INV-003", client: "Initech LLC", amount: 6200, status: "overdue", date: "2026-02-28" },
  { id: "4", number: "INV-004", client: "Umbrella Co", amount: 1900, status: "draft", date: "2026-03-14" },
  { id: "5", number: "INV-005", client: "Wayne Enterprises", amount: 8750, status: "paid", date: "2026-03-08" },
  { id: "6", number: "INV-006", client: "Stark Industries", amount: 3400, status: "pending", date: "2026-03-11" },
  { id: "7", number: "INV-007", client: "Oscorp", amount: 5100, status: "paid", date: "2026-03-05" },
  { id: "8", number: "INV-008", client: "LexCorp", amount: 7600, status: "overdue", date: "2026-02-20" },
];

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((inv) => {
    const matchesFilter = activeFilter === "all" || inv.status === activeFilter;
    const matchesSearch =
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="flex h-14 items-center gap-3 border-b border-border px-6">
            <SidebarTrigger className="text-muted-foreground" />
            <h1 className="font-display text-lg font-semibold text-foreground">
              Invoices Dashboard
            </h1>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-6">
            {/* Analytics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnalyticsCard
                title="Total Received"
                value="$18,350"
                change="↑ 12.5% from last month"
                changeType="positive"
                icon={DollarSign}
                delay={0}
              />
              <AnalyticsCard
                title="Pending Payments"
                value="$6,200"
                change="3 invoices pending"
                changeType="neutral"
                icon={Clock}
                delay={0.1}
              />
              <AnalyticsCard
                title="Overdue Invoices"
                value="$13,800"
                change="↑ 2 new this week"
                changeType="negative"
                icon={AlertTriangle}
                delay={0.2}
              />
            </div>

            {/* Invoice Table Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-6 rounded-xl border border-border bg-card shadow-card"
            >
              {/* Table Header */}
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
                    <Input
                      placeholder="Search invoices..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-9 w-[200px] pl-9 text-sm"
                    />
                  </div>
                  <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    New Invoice
                  </Button>
                </div>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Invoice
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Client
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Amount
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Date Created
                    </TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow key={inv.id} className="group">
                      <TableCell className="font-medium text-foreground">
                        {inv.number}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.client}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        ${inv.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="gap-2 text-sm">
                              <Eye className="h-3.5 w-3.5" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm">
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm text-destructive">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
