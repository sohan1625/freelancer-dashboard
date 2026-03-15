import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MoreHorizontal, Mail, Phone, Eye, Pencil, Trash2, X } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    apiGet<Client[]>("/api/clients")
        .then(setClients)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/clients/${id}`);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleAddClient = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const newClient = await apiPost<Client>("/api/clients", form);
      setClients((prev) => [...prev, newClient]);
      setShowAddDialog(false);
      setForm({ name: "", email: "", phone: "" });
    } catch (err) {
      console.error("Add client failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = clients.filter(
      (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
      <DashboardLayout
          title="Clients"
          headerActions={
            <Button
                size="sm"
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4" /> Add Client
            </Button>
          }
      >
        {/* Add Client Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                    placeholder="e.g. John Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                    placeholder="e.g. john@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                    placeholder="e.g. +1 555 000 1234"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                  onClick={handleAddClient}
                  disabled={saving || !form.name || !form.email}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? "Saving..." : "Add Client"}
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
          <div className="flex items-center justify-between border-b border-border p-5">
            <p className="text-sm font-medium text-muted-foreground">
              {loading ? "Loading..." : `${filtered.length} clients`}
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-[240px] pl-9 text-sm"
              />
            </div>
          </div>

          {error && (
              <div className="p-5 text-sm text-destructive">
                ⚠️ Failed to load clients: {error}
              </div>
          )}

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Loading clients...</TableCell>
                  </TableRow>
              ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No clients found.</TableCell>
                  </TableRow>
              ) : (
                  filtered.map((client) => (
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
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />{client.email}
                            </p>
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />{client.phone}
                            </p>
                          </div>
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
                              <DropdownMenuItem
                                  onClick={() => handleDelete(client.id)}
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

export default Clients;