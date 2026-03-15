import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Clock, Save, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiGet, apiPost } from "@/lib/api";

type Settings = {
  id?: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  newClient: boolean;
  weeklyReport: boolean;
  paymentReminder: boolean;
  beforeDue: number;
  afterOverdue: number;
  maxReminders: number;
};

const Settings = () => {
  const [settings, setSettings] = useState<Settings>({
    name: "",
    email: "",
    company: "",
    phone: "",
    invoicePaid: true,
    invoiceOverdue: true,
    newClient: false,
    weeklyReport: true,
    paymentReminder: true,
    beforeDue: 3,
    afterOverdue: 1,
    maxReminders: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Settings>("/api/settings")
        .then(setSettings)
        .catch(console.error)
        .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiPost<Settings>("/api/settings", settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const card = "rounded-xl border border-border bg-card p-6 shadow-card";

  if (loading) return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center h-40 text-muted-foreground">Loading settings...</div>
      </DashboardLayout>
  );

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
                <Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Email</Label>
                <Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Company</Label>
                <Input value={settings.company} onChange={(e) => setSettings({ ...settings, company: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Phone</Label>
                <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="text-sm" />
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
                          checked={settings[item.key]}
                          onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
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
                <Select
                    value={String(settings.beforeDue)}
                    onValueChange={(v) => setSettings({ ...settings, beforeDue: parseInt(v) })}
                >
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
                <Select
                    value={String(settings.afterOverdue)}
                    onValueChange={(v) => setSettings({ ...settings, afterOverdue: parseInt(v) })}
                >
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
                <Select
                    value={String(settings.maxReminders)}
                    onValueChange={(v) => setSettings({ ...settings, maxReminders: parseInt(v) })}
                >
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

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saved ? (
                  <><CheckCircle className="h-4 w-4" /> Saved!</>
              ) : saving ? (
                  "Saving..."
              ) : (
                  <><Save className="h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </div>

        </div>
      </DashboardLayout>
  );
};

export default Settings;