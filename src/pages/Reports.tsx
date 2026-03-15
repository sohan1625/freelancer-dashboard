import { motion } from "framer-motion";
import { DollarSign, TrendingUp, FileText, Users } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AnalyticsCard } from "@/components/AnalyticsCard";

const revenueData = [
  { month: "Oct", revenue: 8200 },
  { month: "Nov", revenue: 11400 },
  { month: "Dec", revenue: 9800 },
  { month: "Jan", revenue: 14200 },
  { month: "Feb", revenue: 12600 },
  { month: "Mar", revenue: 18350 },
];

const invoiceStats = [
  { month: "Oct", paid: 8, pending: 3, overdue: 1 },
  { month: "Nov", paid: 12, pending: 4, overdue: 2 },
  { month: "Dec", paid: 10, pending: 2, overdue: 1 },
  { month: "Jan", paid: 14, pending: 5, overdue: 3 },
  { month: "Feb", paid: 11, pending: 3, overdue: 2 },
  { month: "Mar", paid: 15, pending: 6, overdue: 2 },
];

const Reports = () => {
  return (
    <DashboardLayout title="Reports">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard title="Total Revenue" value="$74,550" change="↑ 18.2% vs last quarter" changeType="positive" icon={DollarSign} delay={0} />
        <AnalyticsCard title="Avg Invoice" value="$3,420" change="↑ 5.1% from last month" changeType="positive" icon={TrendingUp} delay={0.05} />
        <AnalyticsCard title="Invoices Sent" value="70" change="12 this month" changeType="neutral" icon={FileText} delay={0.1} />
        <AnalyticsCard title="Active Clients" value="8" change="2 new this quarter" changeType="positive" icon={Users} delay={0.15} />
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
          <p className="mt-1 text-sm text-muted-foreground">Monthly revenue over the last 6 months</p>
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
          <p className="mt-1 text-sm text-muted-foreground">Monthly breakdown by status</p>
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
