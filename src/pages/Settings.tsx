import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Clock, Save } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const Settings = () => {
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    email: "alex@freelanceros.com",
    company: "Alex Johnson Design",
    phone: "+1 (555) 000-1234",
  });

  const [notifications, setNotifications] = useState({
    invoicePaid: true,
    invoiceOverdue: true,
    newClient: false,
    weeklyReport: true,
    paymentReminder: true,
  });

  const [reminders, setReminders] = useState({
    beforeDue: "3",
    afterOverdue: "1",
    maxReminders: "3",
  });

  const card = "rounded-xl border border-border bg-card p-6 shadow-card";

  return (
    <DashboardLayout title="Settings">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={card}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">Profile Settings</h3>
              <p className="text-sm text-muted-foreground">Manage your personal information</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Full Name</Label>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Email</Label>
              <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Company</Label>
              <Input value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Phone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="text-sm" />
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className={card}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">Choose what updates you receive</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { key: "invoicePaid" as const, label: "Invoice Paid", desc: "Get notified when a client pays an invoice" },
              { key: "invoiceOverdue" as const, label: "Invoice Overdue", desc: "Alert when an invoice becomes overdue" },
              { key: "newClient" as const, label: "New Client Added", desc: "Notification when a new client is created" },
              { key: "weeklyReport" as const, label: "Weekly Report", desc: "Receive a weekly summary of your finances" },
              { key: "paymentReminder" as const, label: "Payment Reminders", desc: "Reminders for upcoming payment due dates" },
            ].map((item, i) => (
              <div key={item.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                  />
                </div>
                {i < 4 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Invoice Reminders */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className={card}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">Invoice Reminders</h3>
              <p className="text-sm text-muted-foreground">Configure automatic payment reminders</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Days Before Due</Label>
              <Select value={reminders.beforeDue} onValueChange={(v) => setReminders({ ...reminders, beforeDue: v })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Days After Overdue</Label>
              <Select value={reminders.afterOverdue} onValueChange={(v) => setReminders({ ...reminders, afterOverdue: v })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every day</SelectItem>
                  <SelectItem value="3">Every 3 days</SelectItem>
                  <SelectItem value="7">Every week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Max Reminders</Label>
              <Select value={reminders.maxReminders} onValueChange={(v) => setReminders({ ...reminders, maxReminders: v })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Save */}
        <div className="flex justify-end">
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
