import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ComponentType, ReactNode } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    ArrowUpRight,
    BadgePercent,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    FileText,
    FolderKanban,
    LayoutDashboard,
    Plus,
    TriangleAlert,
    Users,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/DashboardLayout";
import { apiGet, ApiError } from "@/lib/api";
import { pill, tk } from "@/lib/ds";
import { useTheme } from "@/hooks/useTheme";

type ApiInvoice = {
    id: number;
    amount: number;
    status: string;
    issueDate?: string;
    dueDate?: string;
    clientId?: number;
    clientName?: string;
    description?: string;
};

type ApiProject = {
    id: number;
    name: string;
    status: string;
    budget?: number;
    startDate?: string;
    deadline?: string;
    client?: { id: number; name: string };
};

type ApiClient = {
    id: number;
    name: string;
    email: string;
    phone?: string;
};

type ApiExpense = {
    id: number;
    name: string;
    category: string;
    amount: number;
    date?: string;
    project?: { id: number; name: string; client?: { id: number; name: string } };
};

type AnalyticsApi = {
    totalInvoices: number;
    paid: number;
    pending: number;
    overdue: number;
    revenueCollected: number;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    topClients: Array<{ name: string; revenue: number }>;
};

type MonthPoint = {
    month: string;
    revenue: number;
    expenses: number;
};

type ProjectStatus = "active" | "completed" | "paused" | "draft";

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";

type InvoiceCard = {
    id: number;
    number: string;
    client: string;
    amount: number;
    dueDate?: string;
    status: InvoiceStatus;
};

type ProjectCard = {
    id: number;
    name: string;
    client: string;
    budget: number;
    deadline?: string;
    status: ProjectStatus;
};

type QuickAction = {
    label: string;
    description: string;
    href: string;
};

function formatINR(value: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function formatShortDate(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "short" });
}

function lastMonthKeys(count: number) {
    const now = new Date();
    const keys: string[] = [];
    for (let i = count - 1; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        keys.push(monthKey(date));
    }
    return keys;
}

function projectStatusLabel(status: ProjectStatus) {
    if (status === "active") return "Active";
    if (status === "completed") return "Completed";
    if (status === "paused") return "On hold";
    return "Draft";
}

function projectStatusTone(status: ProjectStatus) {
    if (status === "active") return { bg: "rgba(93,202,165,0.12)", text: "#5DCAA5", border: "rgba(93,202,165,0.2)" };
    if (status === "completed") return { bg: "rgba(55,138,221,0.12)", text: "#378ADD", border: "rgba(55,138,221,0.2)" };
    if (status === "paused") return { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" };
    return { bg: "rgba(255,255,255,0.05)", text: "#71717a", border: "rgba(255,255,255,0.08)" };
}

function statusLabel(status: InvoiceStatus) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function categoryColor(category: string) {
    const upper = category.toUpperCase();
    if (upper === "SOFTWARE") return "#5DCAA5";
    if (upper === "TRAVEL") return "#378ADD";
    if (upper === "MARKETING") return "#F59E0B";
    if (upper === "OFFICE") return "#F05252";
    if (upper === "FOOD") return "#FB923C";
    return "#a1a1aa";
}

function initials(name: string) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "CL";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function SectionCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode; }) {
    return (
        <section className="rounded-[26px] border border-[rgba(255,255,255,0.58)] bg-[rgba(255,248,241,0.9)] p-5 shadow-[0_18px_50px_rgba(60,22,7,0.05)] backdrop-blur-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[17px] font-semibold tracking-tight text-[#24140b]">{title}</h2>
                    {subtitle ? <p className="mt-1 text-[12px] leading-5 text-[#9a7e69]">{subtitle}</p> : null}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function MetricTile({
    label,
    value,
    sub,
    icon: Icon,
    accent,
    loading,
    emptyCta,
    isEmpty,
}: {
    label: string;
    value: string;
    sub: string;
    icon: ComponentType<{ className?: string }>;
    accent: string;
    loading: boolean;
    emptyCta?: { label: string; onClick: () => void };
    isEmpty?: boolean;
}) {
    return (
        <div className="rounded-[24px] border border-[rgba(255,255,255,0.55)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,247,240,0.92))] p-5 shadow-[0_12px_30px_rgba(62,23,8,0.05)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#a07b65]">{label}</p>
                    <div className="mt-3 text-[28px] font-semibold tracking-tight text-[#23130d]">{loading ? "—" : value}</div>
                    <p className="mt-1 text-[12px] text-[#9a7e69]">{sub}</p>
                    {!loading && isEmpty && emptyCta ? (
                        <button
                            onClick={emptyCta.onClick}
                            className="mt-4 inline-flex items-center rounded-[14px] border border-dashed border-[rgba(196,90,34,0.28)] bg-[rgba(255,83,0,0.03)] px-3 py-2 text-[11px] font-medium text-[#c45a22] transition hover:bg-[rgba(255,83,0,0.06)]"
                        >
                            {emptyCta.label}
                        </button>
                    ) : null}
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-[16px]" style={{ background: accent + "18", color: accent }}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function Index() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const dark = theme === "dark";
    tk(dark);

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsApi | null>(null);
    const [clients, setClients] = useState<ApiClient[]>([]);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
    const [expenses, setExpenses] = useState<ApiExpense[]>([]);
    const displayName = localStorage.getItem("userDisplayName") || localStorage.getItem("userName") || "";
    const greeting = displayName ? `Welcome back, ${displayName}.` : "Welcome back.";

    useEffect(() => {
        async function loadDashboard() {
            setLoading(true);
            try {
                const [analyticsData, clientData, projectData, invoiceData, expenseData] = await Promise.all([
                    apiGet<AnalyticsApi>("/api/analytics"),
                    apiGet<ApiClient[]>("/api/clients"),
                    apiGet<ApiProject[]>("/api/projects"),
                    apiGet<ApiInvoice[]>("/api/clients/invoices"),
                    apiGet<ApiExpense[]>("/api/expenses"),
                ]);

                setAnalytics(analyticsData);
                setClients(clientData ?? []);
                setProjects(projectData ?? []);
                setInvoices(invoiceData ?? []);
                setExpenses(expenseData ?? []);
            } catch (error) {
                toast.error(error instanceof ApiError ? error.message : "Failed to load dashboard.");
            } finally {
                setLoading(false);
            }
        }

        void loadDashboard();
    }, []);

    const projectCards = useMemo<ProjectCard[]>(() => {
        return [...projects]
            .sort((a, b) => Number(new Date(b.deadline ?? 0)) - Number(new Date(a.deadline ?? 0)))
            .map((project) => ({
                id: project.id,
                name: project.name,
                client: project.client?.name ?? "Client",
                budget: Number(project.budget ?? 0),
                deadline: project.deadline,
                status: (String(project.status || "draft").toLowerCase() === "active"
                    ? "active"
                    : String(project.status || "draft").toLowerCase() === "completed"
                        ? "completed"
                        : String(project.status || "draft").toLowerCase() === "on_hold"
                            ? "paused"
                            : "draft") as ProjectStatus,
            }))
            .slice(0, 5);
    }, [projects]);

    const invoiceCards = useMemo<InvoiceCard[]>(() => {
        return [...invoices]
            .sort((a, b) => Number(new Date(b.issueDate ?? b.dueDate ?? 0)) - Number(new Date(a.issueDate ?? a.dueDate ?? 0)))
            .map((invoice) => ({
                id: invoice.id,
                number: `INV-${String(invoice.id).padStart(3, "0")}`,
                client: invoice.clientName ?? "Client",
                amount: Number(invoice.amount ?? 0),
                dueDate: invoice.dueDate,
                status: String(invoice.status || "draft").toLowerCase() as InvoiceStatus,
            }))
            .slice(0, 5);
    }, [invoices]);

    const monthKeys = useMemo(() => lastMonthKeys(6), []);
    const monthlyData: MonthPoint[] = useMemo(() => {
        const revenueMap = new Map<string, number>();
        const expenseMap = new Map<string, number>();

        monthKeys.forEach((key) => {
            revenueMap.set(key, 0);
            expenseMap.set(key, 0);
        });

        for (const row of analytics?.monthlyRevenue ?? []) {
            const labelParts = row.month.split(" ");
            const monthShort = labelParts[0] ?? "";
            const year = labelParts[1] ?? String(new Date().getFullYear());
            const monthIndex = new Date(`${monthShort} 1, ${year}`).getMonth();
            const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
            if (revenueMap.has(key)) {
                revenueMap.set(key, Number(row.revenue ?? 0));
            }
        }

        for (const expense of expenses) {
            if (!expense.date) continue;
            const date = new Date(expense.date);
            if (Number.isNaN(date.getTime())) continue;
            const key = monthKey(date);
            if (expenseMap.has(key)) {
                expenseMap.set(key, (expenseMap.get(key) ?? 0) + Number(expense.amount ?? 0));
            }
        }

        return monthKeys.map((key) => ({
            month: monthLabel(key),
            revenue: revenueMap.get(key) ?? 0,
            expenses: expenseMap.get(key) ?? 0,
        }));
    }, [analytics?.monthlyRevenue, expenses, monthKeys]);

    const overview = useMemo(() => {
        const paidInvoices = invoices.filter((invoice) => String(invoice.status).toUpperCase() === "PAID");
        const pendingInvoices = invoices.filter((invoice) => String(invoice.status).toUpperCase() === "PENDING");
        const overdueInvoices = invoices.filter((invoice) => String(invoice.status).toUpperCase() === "OVERDUE");
        const activeProjects = projects.filter((project) => String(project.status).toUpperCase() === "ACTIVE").length;
        const completedProjects = projects.filter((project) => String(project.status).toUpperCase() === "COMPLETED").length;
        const openExpenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);

        const paidTotal = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
        const unpaidTotal = pendingInvoices.concat(overdueInvoices).reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
        const paidRate = invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 100) : 0;

        const topClient = analytics?.topClients?.[0];
        const topClientShare = topClient && (analytics?.revenueCollected ?? 0) > 0
            ? Math.round((topClient.revenue / (analytics?.revenueCollected ?? 1)) * 100)
            : 0;

        const projectDeadlineSoon = projects.filter((project) => {
            if (!project.deadline) return false;
            const deadline = new Date(project.deadline);
            if (Number.isNaN(deadline.getTime())) return false;
            const diffDays = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7 && String(project.status).toUpperCase() !== "COMPLETED";
        }).length;

        return {
            paidTotal,
            unpaidTotal,
            paidRate,
            activeProjects,
            completedProjects,
            openExpenseTotal,
            topClient,
            topClientShare,
            overdueInvoices,
            projectDeadlineSoon,
        };
    }, [analytics?.revenueCollected, analytics?.topClients, expenses, invoices, projects]);

    const recentExpenses = useMemo(() => {
        return [...expenses]
            .sort((a, b) => Number(new Date(b.date ?? 0)) - Number(new Date(a.date ?? 0)))
            .slice(0, 4);
    }, [expenses]);

    const overdueInvoices = useMemo(() => {
        return invoiceCards.filter((invoice) => invoice.status === "overdue").slice(0, 4);
    }, [invoiceCards]);

    const openProjectCount = projects.filter((project) => String(project.status).toUpperCase() !== "COMPLETED").length;
    const openProjectSubtitle = `${overview.activeProjects} active · ${overview.completedProjects} completed`;
    const topClientShareLabel = overview.topClient ? `${overview.topClientShare}%` : "0%";
    const topClientRiskText = overview.topClient
        ? `${overview.topClient.name} contributes the largest share of paid revenue. Keep an eye on account dependency.`
        : "No paid invoices yet. Start billing to reveal concentration risk and client insights.";

    const hasChartData = monthlyData.some((point) => point.revenue > 0 || point.expenses > 0);

    const quickActions: QuickAction[] = [
        { label: "Add client", description: "Capture a new contact and workspace", href: "/clients" },
        { label: "Create project", description: "Start a new delivery stream", href: "/projects" },
        { label: "Send invoice", description: "Bill a client and collect faster", href: "/invoices" },
    ];

    const attentionItems = [
        { label: `${analytics?.pending ?? 0} unpaid invoices`, tone: "#F59E0B" },
        { label: `${overview.projectDeadlineSoon} project deadline${overview.projectDeadlineSoon === 1 ? "" : "s"} in 7 days`, tone: "#ff5300" },
        { label: `${overview.overdueInvoices.length} overdue invoice${overview.overdueInvoices.length === 1 ? "" : "s"}`, tone: "#F05252" },
    ];

    return (
        <DashboardLayout
            title="Dashboard"
            subtitle="FreelancerOS workspace overview"
            headerActions={
                <button onClick={() => navigate("/invoices")} className="inline-flex items-center gap-2 rounded-full bg-[#ff5300] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_rgba(255,83,0,0.24)] transition hover:brightness-105">
                    <Plus className="h-4 w-4" />
                    New invoice
                </button>
            }
        >
            <div className="space-y-5">
                <section className="grid gap-4 xl:grid-cols-[1.42fr_0.88fr]">
                    <div className="rounded-[32px] border border-[rgba(255,255,255,0.55)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),rgba(249,241,232,0.96)_45%,rgba(244,236,227,0.94)_100%)] p-6 shadow-[0_22px_60px_rgba(55,20,7,0.06)]">
                        <div className="flex flex-wrap items-start justify-between gap-5">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,83,0,0.14)] bg-[rgba(255,83,0,0.08)] px-3 py-1 text-[11px] font-medium text-[#c45a22] shadow-[0_8px_18px_rgba(255,83,0,0.06)]">
                                    <LayoutDashboard className="h-3.5 w-3.5" />
                                    Workspace health is live
                                </div>
                                <h1 className="mt-4 text-[34px] font-semibold tracking-tight text-[#2a170d] lg:text-[38px] xl:text-[42px]">
                                    {greeting}
                                </h1>
                                <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#8e6e5c]">
                                    You have {analytics?.pending ?? 0} unpaid invoice{(analytics?.pending ?? 0) === 1 ? "" : "s"} and {overview.projectDeadlineSoon} project deadline{overview.projectDeadlineSoon === 1 ? "" : "s"} approaching.
                                </p>

                                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                                    {attentionItems.map((item) => (
                                        <div key={item.label} className="rounded-[18px] border border-[rgba(47,27,18,0.08)] bg-white/75 px-3 py-2.5 text-[12px] text-[#4f3728] shadow-[0_8px_22px_rgba(47,27,18,0.03)]">
                                            <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: item.tone }} />
                                            {item.label}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 flex flex-wrap gap-3">
                                    <button onClick={() => navigate("/clients")} className="inline-flex items-center gap-2 rounded-full bg-[#2f1b12] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_12px_28px_rgba(47,27,18,0.18)]">
                                        <Users className="h-4 w-4" />
                                        Review clients
                                    </button>
                                    <button onClick={() => navigate("/projects")} className="inline-flex items-center gap-2 rounded-full border border-[rgba(47,27,18,0.12)] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#2f1b12]">
                                        <FolderKanban className="h-4 w-4" />
                                        Open projects
                                    </button>
                                    <button onClick={() => navigate("/expenses")} className="inline-flex items-center gap-2 rounded-full border border-[rgba(47,27,18,0.12)] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#2f1b12]">
                                        <CircleDollarSign className="h-4 w-4" />
                                        Add expense
                                    </button>
                                </div>
                            </div>

                            <div className="grid min-w-[280px] gap-3">
                                <div className="rounded-[26px] border border-[rgba(255,83,0,0.12)] bg-white/82 p-4 shadow-[0_10px_28px_rgba(47,27,18,0.04)] backdrop-blur-sm">
                                    <div className="flex items-center justify-between text-[12px] text-[#8e6e5c]">
                                        <span>Quick actions</span>
                                        <span className="rounded-full bg-[#fff1e8] px-2 py-1 text-[#c45a22]">Today</span>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {quickActions.map((action) => (
                                            <button
                                                key={action.label}
                                                onClick={() => navigate(action.href)}
                                                className="flex w-full items-start justify-between rounded-[18px] border border-dashed border-[rgba(196,90,34,0.22)] bg-[rgba(255,83,0,0.03)] px-3 py-3 text-left transition hover:bg-[rgba(255,83,0,0.06)]"
                                            >
                                                <div>
                                                    <p className="text-[13px] font-semibold text-[#24140b]">{action.label}</p>
                                                    <p className="mt-1 text-[11px] leading-4 text-[#9a7e69]">{action.description}</p>
                                                </div>
                                                <ArrowUpRight className="mt-0.5 h-4 w-4 text-[#c45a22]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[26px] border border-[rgba(255,83,0,0.12)] bg-white/82 p-4 shadow-[0_10px_28px_rgba(47,27,18,0.04)] backdrop-blur-sm">
                                    <div className="flex items-center justify-between text-[12px] text-[#8e6e5c]">
                                        <span>Recent activity</span>
                                        <span className="rounded-full bg-[#fff1e8] px-2 py-1 text-[#c45a22]">Live</span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-start gap-3 rounded-[18px] bg-[#fff7f0] p-3">
                                            <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[#5DCAA5]" />
                                            <div>
                                                <p className="text-[12px] font-medium text-[#24140b]">{analytics?.paid ?? 0} invoices collected</p>
                                                <p className="text-[11px] text-[#9a7e69]">Revenue is now tracked across paid invoices.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-[18px] bg-[#fff7f0] p-3">
                                            <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                                            <div>
                                                <p className="text-[12px] font-medium text-[#24140b]">{analytics?.pending ?? 0} invoices awaiting payment</p>
                                                <p className="text-[11px] text-[#9a7e69]">Follow up before the due dates stack up.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-[18px] bg-[#fff7f0] p-3">
                                            <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[#ff5300]" />
                                            <div>
                                                <p className="text-[12px] font-medium text-[#24140b]">{projects.length} active delivery items</p>
                                                <p className="text-[11px] text-[#9a7e69]">Project progress is visible in the workflow rail.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <MetricTile label="Total revenue" value={formatINR(analytics?.revenueCollected ?? overview.paidTotal)} sub="Collected from paid invoices" icon={CircleDollarSign} accent="#ff5300" loading={loading} emptyCta={{ label: "+ Send your first invoice", onClick: () => navigate("/invoices") }} isEmpty={Number(analytics?.revenueCollected ?? overview.paidTotal) === 0} />
                        <MetricTile label="Active clients" value={String(clients.length)} sub="Clients inside the workspace" icon={Users} accent="#378ADD" loading={loading} emptyCta={{ label: "+ Add your first client", onClick: () => navigate("/clients") }} isEmpty={clients.length === 0} />
                        <MetricTile label="Open projects" value={String(openProjectCount)} sub={openProjectSubtitle} icon={FolderKanban} accent="#5DCAA5" loading={loading} emptyCta={{ label: "+ Create your first project", onClick: () => navigate("/projects") }} isEmpty={openProjectCount === 0} />
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.38fr_0.82fr]">
                    <SectionCard
                        title="Revenue vs expenses"
                        subtitle="Month-by-month cash flow from your invoices and expenses"
                        action={<span className="rounded-full bg-[#fff1e8] px-3 py-1 text-[11px] font-medium text-[#c45a22]">Last 6 months</span>}
                    >
                        {hasChartData ? (
                            <div className="h-[290px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(192,154,126,0.16)" vertical={false} />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#9a7e69", fontSize: 11 }} />
                                        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9a7e69", fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                background: "#fff8f2",
                                                border: "1px solid rgba(255,83,0,0.15)",
                                                borderRadius: 16,
                                                color: "#24140b",
                                            }}
                                            formatter={(value: number) => formatINR(value)}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#ff5300" fill="rgba(255,83,0,0.2)" strokeWidth={2.2} />
                                        <Area type="monotone" dataKey="expenses" stroke="#378ADD" fill="rgba(55,138,221,0.14)" strokeWidth={2.2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="relative h-[290px] overflow-hidden rounded-[24px] border border-dashed border-[rgba(196,90,34,0.18)] bg-[linear-gradient(180deg,rgba(255,248,241,0.92),rgba(250,243,236,0.88))]">
                                <div className="absolute inset-0 grid place-items-center opacity-60 blur-[0.2px]">
                                    <div className="w-[88%] max-w-[760px] rounded-[24px] border border-[rgba(255,83,0,0.08)] bg-[repeating-linear-gradient(135deg,rgba(255,83,0,0.08)_0_5px,rgba(255,83,0,0.02)_5px_10px)] p-6">
                                        <div className="mb-4 flex items-center justify-between text-[11px] text-[#b08b74]">
                                            <span>Revenue</span>
                                            <span>Expenses</span>
                                        </div>
                                        <div className="flex h-40 items-end gap-3">
                                            {[34, 48, 28, 56, 22, 38].map((height, index) => (
                                                <div key={index} className="flex-1 rounded-t-[16px] bg-[#ff5300]/18" style={{ height: String(height) + "%" }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
                                    <p className="text-[18px] font-semibold text-[#24140b]">Log your first invoice or expense to unlock analytics</p>
                                    <p className="mt-2 max-w-md text-[12px] leading-5 text-[#9a7e69]">
                                        The chart will automatically populate with your monthly cash flow once the workspace has activity.
                                    </p>
                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                        <button onClick={() => navigate("/invoices")} className="rounded-full bg-[#ff5300] px-4 py-2 text-[12px] font-semibold text-white">Create invoice</button>
                                        <button onClick={() => navigate("/expenses")} className="rounded-full border border-[rgba(196,90,34,0.18)] bg-white px-4 py-2 text-[12px] font-semibold text-[#c45a22]">Log expense</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Risk and focus"
                        subtitle="What needs attention before it becomes a bottleneck"
                        action={<BadgePercent className="h-4 w-4 text-[#c45a22]" />}
                    >
                        <div className="space-y-4">
                            <div className="rounded-[22px] border border-[rgba(245,158,11,0.16)] bg-[rgba(245,158,11,0.06)] p-4 shadow-[0_10px_26px_rgba(245,158,11,0.05)]">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[12px] font-medium text-[#9a7e69]">Top client concentration</p>
                                        <p className="mt-1 text-[28px] font-semibold tracking-tight text-[#24140b]">{topClientShareLabel}</p>
                                    </div>
                                    <TriangleAlert className="h-6 w-6 text-[#F59E0B]" />
                                </div>
                                        <p className="mt-2 text-[12px] leading-5 text-[#8e6e5c]">{topClientRiskText}</p>
                            </div>

                            <div className="rounded-[22px] border border-[rgba(93,202,165,0.16)] bg-[rgba(93,202,165,0.06)] p-4 shadow-[0_10px_26px_rgba(93,202,165,0.05)]">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[12px] font-medium text-[#9a7e69]">Cash remaining after expenses</p>
                                        <p className="mt-1 text-[28px] font-semibold tracking-tight text-[#24140b]">{formatINR(Math.max((analytics?.revenueCollected ?? 0) - overview.openExpenseTotal, 0))}</p>
                                    </div>
                                    <CheckCircle2 className="h-6 w-6 text-[#5DCAA5]" />
                                </div>
                                <p className="mt-2 text-[12px] leading-5 text-[#8e6e5c]">
                                    Revenue collected minus all logged expenses in the current dataset.
                                </p>
                            </div>

                            <div className="rounded-[22px] border border-[rgba(255,83,0,0.12)] bg-white/82 p-4 shadow-[0_10px_26px_rgba(47,27,18,0.04)]">
                                <p className="text-[12px] font-medium text-[#9a7e69]">Next actions</p>
                                <div className="mt-3 space-y-3 text-[12px] text-[#6f4b38]">
                                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#ff5300]" /> Create or send the next invoice</div>
                                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#ff5300]" /> Add a client with email and phone</div>
                                    <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#ff5300]" /> Review overdue invoices and deadlines</div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
                    <SectionCard title="Recent invoices" subtitle="Latest billing activity from the workspace" action={<button onClick={() => navigate("/invoices")} className="text-[12px] font-medium text-[#c45a22]">View all</button>}>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="rounded-[20px] border border-dashed border-[rgba(255,83,0,0.15)] p-6 text-sm text-[#9a7e69]">Loading invoices...</div>
                            ) : invoiceCards.length === 0 ? (
                                <div className="rounded-[20px] border border-dashed border-[rgba(255,83,0,0.15)] p-6 text-sm text-[#9a7e69]">No invoices yet.</div>
                            ) : (
                                invoiceCards.map((invoice) => {
                                    const p = pill(invoice.status, false);
                                    return (
                                        <div key={invoice.id} className="flex items-center gap-4 rounded-[22px] border border-[rgba(255,255,255,0.6)] bg-white/82 p-4 shadow-[0_8px_22px_rgba(47,27,18,0.04)]">
                                            <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#2f1b12] text-[11px] font-semibold text-white">{invoice.number}</div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-[14px] font-semibold text-[#24140b]">{invoice.client}</p>
                                                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: p.bg, color: p.text, border: "1px solid " + p.border }}>
                                                        {statusLabel(invoice.status)}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[12px] text-[#9a7e69]">Due {formatShortDate(invoice.dueDate)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[14px] font-semibold text-[#24140b]">{formatINR(invoice.amount)}</p>
                                                <p className="text-[11px] text-[#9a7e69]">#{String(invoice.id).padStart(3, "0")}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard title="Active projects" subtitle="Delivery progress across client work" action={<button onClick={() => navigate("/projects")} className="text-[12px] font-medium text-[#c45a22]">View all</button>}>
                        <div className="space-y-3">
                            {projectCards.length === 0 ? (
                                <div className="rounded-[20px] border border-dashed border-[rgba(255,83,0,0.15)] p-6 text-sm text-[#9a7e69]">No projects yet.</div>
                            ) : (
                                projectCards.map((project) => {
                                    const tone = projectStatusTone(project.status);
                                    return (
                                        <div key={project.id} className="rounded-[22px] border border-[rgba(255,255,255,0.6)] bg-white/82 p-4 shadow-[0_8px_22px_rgba(47,27,18,0.04)]">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="truncate text-[14px] font-semibold text-[#24140b]">{project.name}</p>
                                                    <p className="mt-1 text-[12px] text-[#9a7e69]">{project.client}</p>
                                                </div>
                                                <span className="rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: tone.bg, color: tone.text, border: "1px solid " + tone.border }}>
                                                    {projectStatusLabel(project.status)}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between text-[12px] text-[#8e6e5c]">
                                                <span>Budget</span>
                                                <span className="font-medium text-[#24140b]">{formatINR(project.budget)}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-[12px] text-[#8e6e5c]">
                                                <span>Deadline</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock3 className="h-3.5 w-3.5 text-[#c45a22]" />
                                                    {formatShortDate(project.deadline)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </SectionCard>
                </section>

                <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                    <SectionCard title="Clients" subtitle="People and businesses inside the workspace" action={<button onClick={() => navigate("/clients")} className="text-[12px] font-medium text-[#c45a22]">Open clients</button>}>
                        <div className="space-y-3">
                            {clients.slice(0, 5).map((client, index) => (
                                <div key={client.id} className="flex items-center gap-3 rounded-[20px] border border-[rgba(255,255,255,0.6)] bg-white/82 p-3 shadow-[0_8px_22px_rgba(47,27,18,0.035)]">
                                    <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#fff1e8] text-[12px] font-semibold text-[#c45a22]">
                                        {initials(client.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-semibold text-[#24140b]">{client.name}</p>
                                        <p className="truncate text-[12px] text-[#9a7e69]">{client.email}</p>
                                    </div>
                                    <span className="text-[11px] font-medium text-[#9a7e69]">#{String(index + 1).padStart(2, "0")}</span>
                                </div>
                            ))}
                            {clients.length === 0 ? <div className="rounded-[20px] border border-dashed border-[rgba(255,83,0,0.15)] p-6 text-sm text-[#9a7e69]">No clients yet.</div> : null}
                        </div>
                    </SectionCard>

                    <SectionCard title="Recent expenses" subtitle="Spending logged against the workspace" action={<button onClick={() => navigate("/expenses")} className="text-[12px] font-medium text-[#c45a22]">View expenses</button>}>
                        <div className="space-y-3">
                            {recentExpenses.length === 0 ? (
                                <div className="rounded-[20px] border border-dashed border-[rgba(255,83,0,0.15)] p-6 text-sm text-[#9a7e69]">No expenses logged.</div>
                            ) : (
                                recentExpenses.map((expense) => {
                                    const accent = categoryColor(expense.category);
                                    return (
                                        <div key={expense.id} className="flex items-center gap-3 rounded-[20px] border border-[rgba(255,255,255,0.6)] bg-white/82 p-3 shadow-[0_8px_22px_rgba(47,27,18,0.035)]">
                                            <div className="grid h-10 w-10 place-items-center rounded-[14px]" style={{ background: accent + "18", color: accent }}>
                                                <BadgePercent className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[13px] font-semibold text-[#24140b]">{expense.name}</p>
                                                <p className="truncate text-[12px] text-[#9a7e69]">{expense.category} · {expense.project?.name ?? "Unlinked project"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[13px] font-semibold text-[#24140b]">{formatINR(Number(expense.amount ?? 0))}</p>
                                                <p className="text-[11px] text-[#9a7e69]">{formatShortDate(expense.date)}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </SectionCard>
                </section>

                <section className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
                    <SectionCard title="Overdue invoices" subtitle="Items that need follow-up now" action={<button onClick={() => navigate("/invoices")} className="text-[12px] font-medium text-[#c45a22]">Open billing</button>}>
                        <div className="space-y-3">
                            {overdueInvoices.length === 0 ? (
                                <div className="rounded-[20px] border border-dashed border-[rgba(255,83,0,0.15)] p-6 text-sm text-[#9a7e69]">No overdue invoices.</div>
                            ) : (
                                overdueInvoices.map((invoice) => (
                                    <div key={invoice.id} className="rounded-[20px] border border-[rgba(240,82,82,0.14)] bg-[rgba(240,82,82,0.06)] p-4 shadow-[0_8px_22px_rgba(240,82,82,0.05)]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-[13px] font-semibold text-[#24140b]">{invoice.client}</p>
                                                <p className="mt-1 text-[12px] text-[#9a7e69]">Due {formatShortDate(invoice.dueDate)}</p>
                                            </div>
                                            <span className="rounded-full bg-[rgba(240,82,82,0.12)] px-2.5 py-1 text-[10px] font-medium text-[#F05252]">
                                                Overdue
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[12px] text-[#9a7e69]">{invoice.number}</span>
                                            <span className="text-[14px] font-semibold text-[#24140b]">{formatINR(invoice.amount)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard title="Top client mix" subtitle="Revenue concentration across paying clients">
                        <div className="space-y-4">
                            {(analytics?.topClients ?? []).slice(0, 4).map((client, index) => {
                                const total = analytics?.revenueCollected ?? 0;
                                const share = total > 0 ? Math.round((client.revenue / total) * 100) : 0;
                                return (
                                    <div key={client.name} className="rounded-[20px] border border-[rgba(255,255,255,0.6)] bg-white/82 p-4 shadow-[0_8px_22px_rgba(47,27,18,0.04)]">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#2f1b12] text-[11px] font-semibold text-white">
                                                    {String(index + 1).padStart(2, "0")}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-semibold text-[#24140b]">{client.name}</p>
                                                    <p className="text-[12px] text-[#9a7e69]">{formatINR(client.revenue)}</p>
                                                </div>
                                            </div>
                                            <span className="text-[12px] font-semibold text-[#c45a22]">{share}%</span>
                                        </div>
                                        <div className="mt-3 h-2 rounded-full bg-[#fff1e8]">
                                            <div className="h-2 rounded-full bg-[#ff5300]" style={{ width: String(Math.max(8, share)) + "%" }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {!(analytics?.topClients?.length ?? 0) ? <div className="rounded-[20px] border border-dashed border-[rgba(255,83,0,0.15)] p-6 text-sm text-[#9a7e69]">No paid revenue yet.</div> : null}
                        </div>
                    </SectionCard>
                </section>
            </div>
        </DashboardLayout>
    );
}
