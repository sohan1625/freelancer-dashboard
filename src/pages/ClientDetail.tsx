import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft, Mail, Phone, IndianRupee,
    FileText, FolderOpen, Clock, AlertCircle, Download,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import { apiGet, ApiError } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

// ─── Types ────────────────────────────────────────────────────────────────────

type Client = {
    id: number;
    name: string;
    email: string;
    phone?: string;
};

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";

type Invoice = {
    id: number;
    amount: number;
    status: string;
    dueDate: string;
};

type Project = {
    id: number;
    name: string;
    status: string;
    deadline?: string;
    budget?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(value: number): string {
    return "₹" + value.toLocaleString("en-IN");
}

function normalizeStatus(status: string): InvoiceStatus {
    return status.toLowerCase() as InvoiceStatus;
}

const PROJECT_STATUS_STYLES: Record<string, string> = {
    ACTIVE:    "bg-emerald-500/10 text-emerald-600",
    COMPLETED: "bg-blue-500/10 text-blue-600",
    ON_HOLD:   "bg-amber-500/10 text-amber-600",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
    ACTIVE:    "Active",
    COMPLETED: "Completed",
    ON_HOLD:   "On Hold",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, accent }: {
    title: string; value: string; icon: React.ReactNode; accent: string;
}) {
    return (
        <div className="bg-card border rounded-xl p-5 flex items-start justify-between gap-4">
            <div>
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                {icon}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClientDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [client, setClient] = useState<Client | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    useEffect(() => {
        if (id) void loadAll(id);
    }, [id]);

    async function loadAll(clientId: string) {
        setLoading(true);
        try {
            const [clientData, invoiceData, projectData] = await Promise.all([
                apiGet<Client>(`/api/clients/${clientId}`),
                apiGet<Invoice[]>(`/api/clients/${clientId}/invoices`),
                apiGet<Project[]>(`/api/clients/${clientId}/projects`),
            ]);
            setClient(clientData);
            setInvoices(invoiceData);
            setProjects(projectData);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to load client.";
            toast.error(message);
            navigate("/clients");
        } finally {
            setLoading(false);
        }
    }

    async function handleDownloadPdf(invoiceId: number) {
        setDownloadingId(invoiceId);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE}/api/clients/invoices/${invoiceId}/pdf`, {
                headers: { Authorization: token ? `Bearer ${token}` : "" },
            });
            if (!res.ok) throw new Error("Failed to generate PDF.");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`Invoice #${invoiceId} downloaded.`);
        } catch {
            toast.error("Failed to download PDF.");
        } finally {
            setDownloadingId(null);
        }
    }

    // ── Computed stats ─────────────────────────────────────────────────────────

    const totalRevenue = invoices
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + Number(i.amount), 0);

    const paid    = invoices.filter((i) => i.status === "PAID").length;
    const pending = invoices.filter((i) => i.status === "PENDING").length;
    const overdue = invoices.filter((i) => i.status === "OVERDUE").length;

    // ── Loading ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <DashboardLayout title="Client">
                <div className="space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </div>
            </DashboardLayout>
        );
    }

    if (!client) return null;

    return (
        <DashboardLayout title={client.name}>
            <div className="space-y-6">

                {/* ── Back + Client Info ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border rounded-xl p-6"
                >
                    <button
                        onClick={() => navigate("/clients")}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Clients
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold mb-3">
                                {client.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">{client.name}</h2>
                            <div className="mt-2 space-y-1">
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" /> {client.email}
                                </p>
                                {client.phone && (
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4" /> {client.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Stat Cards ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <StatCard
                        title="Total Revenue"
                        value={formatINR(totalRevenue)}
                        icon={<IndianRupee className="h-5 w-5" />}
                        accent="bg-emerald-500/10 text-emerald-600"
                    />
                    <StatCard
                        title="Paid"
                        value={String(paid)}
                        icon={<FileText className="h-5 w-5" />}
                        accent="bg-blue-500/10 text-blue-600"
                    />
                    <StatCard
                        title="Pending"
                        value={String(pending)}
                        icon={<Clock className="h-5 w-5" />}
                        accent="bg-amber-500/10 text-amber-600"
                    />
                    <StatCard
                        title="Overdue"
                        value={String(overdue)}
                        icon={<AlertCircle className="h-5 w-5" />}
                        accent="bg-red-500/10 text-red-600"
                    />
                </motion.div>

                {/* ── Invoices ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border rounded-xl p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-foreground">Invoices</h3>
                        </div>
                        <Link to="/invoices" className="text-xs text-primary hover:underline">
                            View all
                        </Link>
                    </div>

                    {invoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            No invoices for this client yet.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-mono text-sm text-muted-foreground">
                                            #{inv.id}
                                        </TableCell>
                                        <TableCell>{formatINR(inv.amount)}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={normalizeStatus(inv.status)} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{inv.dueDate}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5"
                                                disabled={downloadingId === inv.id}
                                                onClick={() => handleDownloadPdf(inv.id)}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                {downloadingId === inv.id ? "..." : "PDF"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </motion.div>

                {/* ── Projects ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-card border rounded-xl p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-foreground">Projects</h3>
                        </div>
                        <Link to="/projects" className="text-xs text-primary hover:underline">
                            View all
                        </Link>
                    </div>

                    {projects.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            No projects for this client yet.
                        </p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="border rounded-xl p-4 space-y-2"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-foreground leading-tight">
                                            {project.name}
                                        </p>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${PROJECT_STATUS_STYLES[project.status] ?? "bg-muted text-muted-foreground"}`}>
                      {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                    </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        {project.deadline && (
                                            <span>Due {project.deadline}</span>
                                        )}
                                        {project.budget && (
                                            <span>{formatINR(Number(project.budget))}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

            </div>
        </DashboardLayout>
    );
}
