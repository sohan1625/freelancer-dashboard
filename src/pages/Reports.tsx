import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, FileText, Users } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import { apiGet } from "@/lib/api";

type Analytics = {
  totalInvoices: number;
  paid: number;
  pending: number;
  overdue: number;
  revenueCollected: number;
};

type Client = {
  id: number;
  name: string;
};

const Reports = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<Analytics>("/api/analytics"),
      apiGet<Client[]>("/api/clients"),
    ])
        .then(([ana, clients]) => {
          setAnalytics(ana);
          setClientCount(clients.length);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
  }, []);

  // Build invoice stats from analytics for the bar chart
  const invoiceStats = analytics
      ? [{ month: "Now", paid: analytics.paid, pending: analytics.pending, overdue: analytics.overdue }]
      : [];

  // Build revenue data for area chart
  const revenueData = analytics
      ? [{ month: "Now", revenue: analytics.revenueCollected }]
      : [];

  return (
      <DashboardLayout title="Reports">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnalyticsCard
              title="Total Revenue"
              value={loading ? "..." : `$${analytics?.revenueCollected?.toLocaleString() ?? 0}`}
              change="From paid invoices"
              changeType="positive"
              icon={DollarSign}
              delay={0}
          />
          <AnalyticsCard
              title="Total Invoices"
              value={loading ? "..." : `${analytics?.totalInvoices ?? 0}`}
              change="All time"
              changeType="neutral"
              icon={TrendingUp}
              delay={0.05}
          />
          <AnalyticsCard
              title="Invoices Paid"
              value={loading ? "..." : `${analytics?.paid ?? 0}`}
              change={`${analytics?.pending ?? 0} still pending`}
              changeType="positive"
              icon={FileText}
              delay={0.1}
          />
          <AnalyticsCard
              title="Active Clients"
              value={loading ? "..." : `${clientCount}`}
              change="Total clients"
              changeType="positive"
              icon={Users}
              delay={0.15}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-display text-base font-semibold text-foreground">Total Revenue</h3>
            <p className="mt-1 text-sm text-muted-foreground">Revenue collected from paid invoices</p>
            <div className="mt-6 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(168, 60%, 40%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(168, 60%, 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                      contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: 8, fontSize: 13 }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(168, 60%, 40%)" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Invoice Stats Chart */}
          <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-display text-base font-semibold text-foreground">Invoice Statistics</h3>
            <p className="mt-1 text-sm text-muted-foreground">Breakdown by status</p>
            <div className="mt-6 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={invoiceStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="paid" name="Paid" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm bg-[hsl(152,60%,42%)]" /> Paid</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm bg-[hsl(38,92%,50%)]" /> Pending</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm bg-[hsl(0,72%,51%)]" /> Overdue</div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
  );
};

export default Reports;