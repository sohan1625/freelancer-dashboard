import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Users, FileText, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import { ds, tk } from "@/lib/ds";
import { apiGet, ApiError } from "@/lib/api";

type ApiInvoice = {
  id: number;
  amount: number;
  status: string;
  issueDate?: string;
  dueDate?: string;
  clientId?: number;
  clientName?: string;
};

type ApiExpense = {
  id: number;
  amount: number;
  date?: string;
};

type ApiClient = {
  id: number;
  name: string;
};

type MonthlyPoint = {
  month: string;
  revenue: number;
  expenses: number;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string) {
  const [yearStr, monthStr] = key.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return date.toLocaleString("en-IN", { month: "short" });
}

function lastNMonthKeys(n: number) {
  const now = new Date();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

function inSelectedMonths(dateStr: string | undefined, selectedKeys: Set<string>) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return selectedKeys.has(monthKey(d));
}

function rangeToMonthCount(range: string) {
  if (range === "1M") return 1;
  if (range === "3M") return 3;
  if (range === "6M") return 6;
  return 12;
}

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AnalyticsDashboard() {
  const ui = tk(true);
  const [timeRange, setTimeRange] = useState("6M");
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [clients, setClients] = useState<ApiClient[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [invoiceData, expenseData, clientData] = await Promise.all([
          apiGet<ApiInvoice[]>("/api/clients/invoices"),
          apiGet<ApiExpense[]>("/api/expenses"),
          apiGet<ApiClient[]>("/api/clients"),
        ]);

        setInvoices(invoiceData ?? []);
        setExpenses(expenseData ?? []);
        setClients(clientData ?? []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const monthKeys = useMemo(() => lastNMonthKeys(rangeToMonthCount(timeRange)), [timeRange]);

  const {
    totalRevenue,
    activeClients,
    invoicesSent,
    netProfitMargin,
    revenueData,
    clientConcentration,
    insight,
  } = useMemo(() => {
    const selectedSet = new Set(monthKeys);

    const filteredInvoices = invoices.filter((inv) =>
      inSelectedMonths(inv.issueDate ?? inv.dueDate, selectedSet)
    );
    const filteredExpenses = expenses.filter((exp) => inSelectedMonths(exp.date, selectedSet));

    const paidInvoices = filteredInvoices.filter((inv) => String(inv.status).toUpperCase() === "PAID");

    const revenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const expenseTotal = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const margin = revenue > 0 ? Math.round(((revenue - expenseTotal) / revenue) * 100) : 0;

    const activeClientSet = new Set(
      filteredInvoices
        .map((inv) => (inv.clientId != null ? String(inv.clientId) : inv.clientName || ""))
        .filter((v) => v)
    );

    const revByMonth = new Map<string, number>();
    const expByMonth = new Map<string, number>();

    monthKeys.forEach((k) => {
      revByMonth.set(k, 0);
      expByMonth.set(k, 0);
    });

    for (const inv of paidInvoices) {
      const d = inv.issueDate ?? inv.dueDate;
      if (!d) continue;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) continue;
      const key = monthKey(dt);
      if (!revByMonth.has(key)) continue;
      revByMonth.set(key, (revByMonth.get(key) || 0) + Number(inv.amount || 0));
    }

    for (const exp of filteredExpenses) {
      if (!exp.date) continue;
      const dt = new Date(exp.date);
      if (Number.isNaN(dt.getTime())) continue;
      const key = monthKey(dt);
      if (!expByMonth.has(key)) continue;
      expByMonth.set(key, (expByMonth.get(key) || 0) + Number(exp.amount || 0));
    }

    const monthSeries: MonthlyPoint[] = monthKeys.map((k) => ({
      month: monthLabelFromKey(k),
      revenue: revByMonth.get(k) || 0,
      expenses: expByMonth.get(k) || 0,
    }));

    const clientRevenueMap = new Map<string, number>();
    for (const inv of paidInvoices) {
      const key = inv.clientName || "Unknown";
      clientRevenueMap.set(key, (clientRevenueMap.get(key) || 0) + Number(inv.amount || 0));
    }

    const concentration = Array.from(clientRevenueMap.entries())
      .map(([name, amount]) => ({
        name,
        value: revenue > 0 ? Math.round((amount / revenue) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    const topClient = concentration[0];
    const insightText = !topClient
      ? "No paid invoice data yet. Create and mark invoices as paid to unlock AI insights."
      : topClient.value >= 45
        ? `${topClient.name} contributes ${topClient.value}% of paid revenue. Consider diversifying to reduce concentration risk.`
        : `${topClient.name} leads with ${topClient.value}% of paid revenue. Your revenue mix looks reasonably distributed.`;

    return {
      totalRevenue: revenue,
      activeClients: activeClientSet.size > 0 ? activeClientSet.size : clients.length,
      invoicesSent: filteredInvoices.length,
      netProfitMargin: margin,
      revenueData: monthSeries,
      clientConcentration: concentration,
      insight: insightText,
    };
  }, [clients.length, expenses, invoices, monthKeys]);

  return (
      <DashboardLayout title="Analytics">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`${ds.font["2xl"]} ${ds.weight.semibold} ${ui.primary} tracking-tight`}>Analytics & Insights</h1>
            <p className={`${ds.font.sm} ${ui.muted} mt-1`}>Your financial health at a glance.</p>
          </div>

          {/* Time Range Selector */}
          <div className={`flex items-center ${ui.card} p-1`}>
            {['1M', '3M', '6M', '1Y'].map(range => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${timeRange === range ? 'bg-[#222] text-white' : ui.muted + ' hover:text-white'}`}
                >
                  {range}
                </button>
            ))}
          </div>
        </div>

        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AnalyticsCard
              title="Total Revenue"
            value={fmtINR(totalRevenue)}
            change={loading ? "..." : `${timeRange} view`}
            changeType="neutral"
              icon={IndianRupee}
              delay={0.1}
          />
          <AnalyticsCard
              title="Active Clients"
            value={String(activeClients)}
            change={loading ? "..." : `of ${clients.length} total`}
            changeType="neutral"
              icon={Users}
              delay={0.2}
          />
          <AnalyticsCard
              title="Invoices Sent"
            value={String(invoicesSent)}
            change={loading ? "..." : `${timeRange} range`}
            changeType="neutral"
              icon={FileText}
              delay={0.3}
          />
          <AnalyticsCard
              title="Net Profit Margin"
            value={`${netProfitMargin}%`}
            change={loading ? "..." : netProfitMargin >= 50 ? "Healthy" : "Watch spend"}
            changeType={netProfitMargin >= 50 ? "positive" : netProfitMargin >= 0 ? "neutral" : "negative"}
              icon={TrendingUp}
              delay={0.4}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Revenue Chart */}
          <div className={`${ui.card} p-6 lg:col-span-2`}>
            <div className="mb-6">
              <h3 className={`${ds.font.md} ${ds.weight.medium} ${ui.primary}`}>Revenue vs Expenses</h3>
              <p className={`${ds.font.sm} ${ui.muted} mt-1`}>Monthly cash flow overview.</p>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ds.color.green} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={ds.color.green} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ds.color.red} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={ds.color.red} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke={ds.dark.text.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={ds.dark.text.muted} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip
                      contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={ds.color.green} strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" stroke={ds.color.red} strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Client Concentration Chart */}
          <div className={`${ui.card} p-6`}>
            <div className="mb-6">
              <h3 className={`${ds.font.md} ${ds.weight.medium} ${ui.primary}`}>Client Concentration</h3>
              <p className={`${ds.font.sm} ${ui.muted} mt-1`}>Revenue distribution by client.</p>
            </div>

            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientConcentration} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke={ds.dark.text.muted} fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="value" fill={ds.color.blue} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AI Insight Badge */}
            <div className="mt-4 p-4 rounded-lg bg-[rgba(55,138,221,0.1)] border border-[rgba(55,138,221,0.2)]">
              <p className={`${ds.font.sm} ${ds.weight.medium} ${ui.primary}`}>🤖 AI Insight</p>
              <p className={`${ds.font.xs} ${ui.secondary} mt-1 leading-relaxed`}>
                {insight}
              </p>
            </div>
          </div>

        </div>
      </DashboardLayout>
  );
}