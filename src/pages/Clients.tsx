import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MoreHorizontal, Mail, Phone, Eye, Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const clients = [
  { id: "1", name: "Acme Corp", email: "billing@acme.com", phone: "+1 (555) 123-4567", totalInvoices: 12, totalAmount: 54000, lastInvoice: "2026-03-12" },
  { id: "2", name: "Globex Inc", email: "ap@globex.com", phone: "+1 (555) 234-5678", totalInvoices: 8, totalAmount: 22400, lastInvoice: "2026-03-10" },
  { id: "3", name: "Initech LLC", email: "finance@initech.com", phone: "+1 (555) 345-6789", totalInvoices: 5, totalAmount: 31000, lastInvoice: "2026-02-28" },
  { id: "4", name: "Umbrella Co", email: "pay@umbrella.co", phone: "+1 (555) 456-7890", totalInvoices: 3, totalAmount: 5700, lastInvoice: "2026-03-14" },
  { id: "5", name: "Wayne Enterprises", email: "accounts@wayne.com", phone: "+1 (555) 567-8901", totalInvoices: 15, totalAmount: 131250, lastInvoice: "2026-03-08" },
  { id: "6", name: "Stark Industries", email: "billing@stark.com", phone: "+1 (555) 678-9012", totalInvoices: 7, totalAmount: 23800, lastInvoice: "2026-03-11" },
  { id: "7", name: "Oscorp", email: "finance@oscorp.net", phone: "+1 (555) 789-0123", totalInvoices: 10, totalAmount: 51000, lastInvoice: "2026-03-05" },
  { id: "8", name: "LexCorp", email: "ap@lexcorp.com", phone: "+1 (555) 890-1234", totalInvoices: 6, totalAmount: 45600, lastInvoice: "2026-02-20" },
];

const Clients = () => {
  const [search, setSearch] = useState("");

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Clients"
      headerActions={
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-border bg-card shadow-card"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <p className="text-sm font-medium text-muted-foreground">{filtered.length} clients</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-[240px] pl-9 text-sm" />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Invoices</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Amount</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Invoice</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                      {client.name.charAt(0)}
                    </div>
                    <span className="font-medium text-foreground">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{client.email}</p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{client.phone}</p>
                  </div>
                </TableCell>
                <TableCell className="text-foreground font-medium">{client.totalInvoices}</TableCell>
                <TableCell className="text-foreground font-medium">${client.totalAmount.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(client.lastInvoice).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                      <DropdownMenuItem className="gap-2 text-sm text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </DashboardLayout>
  );
};

export default Clients;
