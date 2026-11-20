import { FormEvent, useEffect, useState } from "react";
import { CalendarClock, Pause, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/api";
import { getClients, type Client } from "@/lib/clients";
import { ds, tk } from "@/lib/ds";

type Frequency = "WEEKLY" | "MONTHLY" | "YEARLY";

interface RecurringInvoice {
  id: number;
  client: { id: number; name: string } | null;
  description: string;
  amount: number;
  frequency: Frequency;
  nextRunDate: string;
  scheduledTime: string | null;
  active: boolean;
}

interface ScheduleForm {
  clientId: string;
  description: string;
  amount: string;
  frequency: Frequency;
  startDate: string;
  scheduledTime: string;
}

const DEFAULT_TIME = "09:00";

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function displayTime(value: string | null | undefined) {
  const [hoursText, minutes] = (value || DEFAULT_TIME).split(":");
  const hours = Number(hoursText);
  return `${((hours + 11) % 12) + 1}:${minutes} ${hours < 12 ? "AM" : "PM"} IST`;
}

function displayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function RecurringInvoicesPage() {
  const ui = tk(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [schedules, setSchedules] = useState<RecurringInvoice[]>([]);
  const [times, setTimes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ScheduleForm>({
    clientId: "",
    description: "",
    amount: "",
    frequency: "MONTHLY",
    startDate: localToday(),
    scheduledTime: DEFAULT_TIME,
  });

  async function loadData() {
    setLoading(true);
    try {
      const [clientData, scheduleData] = await Promise.all([
        getClients(),
        apiGet<RecurringInvoice[]>("/api/recurring-invoices"),
      ]);
      setClients(clientData);
      setSchedules(scheduleData);
      setTimes(Object.fromEntries(
        scheduleData.map((schedule) => [schedule.id, (schedule.scheduledTime || DEFAULT_TIME).slice(0, 5)])
      ));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load recurring invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.clientId || !form.startDate || !form.scheduledTime || Number(form.amount) <= 0) {
      toast.error("Choose a client, valid amount, start date, and generation time.");
      return;
    }

    setCreating(true);
    try {
      const created = await apiPost<RecurringInvoice>("/api/recurring-invoices", {
        clientId: Number(form.clientId),
        description: form.description.trim(),
        amount: Number(form.amount),
        frequency: form.frequency,
        startDate: form.startDate,
        scheduledTime: `${form.scheduledTime}:00`,
      });
      setSchedules((current) => [created, ...current]);
      setTimes((current) => ({ ...current, [created.id]: form.scheduledTime }));
      setForm({
        clientId: "",
        description: "",
        amount: "",
        frequency: "MONTHLY",
        startDate: localToday(),
        scheduledTime: DEFAULT_TIME,
      });
      toast.success("Recurring invoice schedule created.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create recurring invoice.");
    } finally {
      setCreating(false);
    }
  }

  async function saveTime(schedule: RecurringInvoice) {
    const scheduledTime = times[schedule.id];
    if (!scheduledTime) {
      toast.error("Select a generation time.");
      return;
    }
    try {
      const updated = await apiPatch<RecurringInvoice>(`/api/recurring-invoices/${schedule.id}/time`, {
        scheduledTime: `${scheduledTime}:00`,
      });
      setSchedules((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success("Generation time updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update generation time.");
    }
  }

  async function toggleActive(schedule: RecurringInvoice) {
    if (!schedule.active) {
      toast.error("Inactive schedules cannot be reactivated yet. Create a new schedule instead.");
      return;
    }
    try {
      await apiPatch(`/api/recurring-invoices/${schedule.id}/deactivate`);
      setSchedules((current) => current.map((item) => item.id === schedule.id ? { ...item, active: false } : item));
      toast.success("Recurring schedule paused.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to pause recurring schedule.");
    }
  }

  async function deleteSchedule(schedule: RecurringInvoice) {
    try {
      await apiDelete(`/api/recurring-invoices/${schedule.id}`);
      setSchedules((current) => current.filter((item) => item.id !== schedule.id));
      toast.success("Recurring schedule deleted.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete recurring schedule.");
    }
  }

  return (
    <DashboardLayout title="Recurring invoices" subtitle="Choose when each recurring invoice is generated">
      <div className="mb-7 flex items-start gap-3">
        <div className="rounded-xl bg-[#ff5300]/15 p-3 text-[#ff7b3d]">
          <CalendarClock size={22} />
        </div>
        <div>
          <h1 className={`${ds.font["2xl"]} ${ds.weight.semibold} ${ui.primary}`}>Recurring invoices</h1>
          <p className={`${ds.font.sm} ${ui.muted}`}>Schedules use India Standard Time (IST).</p>
        </div>
        <Link to="/invoices" className="ml-auto text-sm text-[#ff7b3d] hover:text-[#ffa071]">
          View generated invoices
        </Link>
      </div>

      <form onSubmit={(event) => void createSchedule(event)} className={`${ui.card} mb-6 p-5`}>
        <h2 className="mb-4 text-base font-semibold text-white">Create schedule</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-xs text-gray-400">
            Client
            <select
              required
              value={form.clientId}
              onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
              className={ui.input}
            >
              <option value="">Select client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs text-gray-400">
            Amount
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              className={ui.input}
              placeholder="0.00"
            />
          </label>
          <label className="space-y-1 text-xs text-gray-400">
            Frequency
            <select
              value={form.frequency}
              onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value as Frequency }))}
              className={ui.input}
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-gray-400">
            First generation date
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              className={ui.input}
            />
          </label>
          <label className="space-y-1 text-xs text-gray-400">
            Generation time (IST)
            <input
              required
              type="time"
              value={form.scheduledTime}
              onChange={(event) => setForm((current) => ({ ...current, scheduledTime: event.target.value }))}
              className={ui.input}
            />
          </label>
          <label className="space-y-1 text-xs text-gray-400">
            Description
            <input
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className={ui.input}
              placeholder="Recurring service"
            />
          </label>
        </div>
        <Button type="submit" disabled={creating} className={`${ui.btnPrimary} mt-4`}>
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Saving..." : "Create recurring schedule"}
        </Button>
      </form>

      <div className={`${ui.card} overflow-x-auto`}>
        <table className="w-full min-w-[780px] text-left">
          <thead>
            <tr className={`border-b ${ui.divider} text-[11px] uppercase tracking-wider ${ui.muted}`}>
              <th className="p-4 font-medium">Client / Description</th>
              <th className="p-4 text-right font-medium">Amount</th>
              <th className="p-4 font-medium">Frequency</th>
              <th className="p-4 font-medium">Next generation</th>
              <th className="p-4 font-medium">Time (IST)</th>
              <th className="p-4 font-medium">Status / Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-sm text-gray-400" colSpan={6}>Loading schedules...</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td className="p-4 text-sm text-gray-400" colSpan={6}>No recurring schedules yet.</td></tr>
            ) : schedules.map((schedule) => (
              <tr key={schedule.id} className={`border-b ${ui.divider} last:border-0`}>
                <td className="p-4">
                  <div className="text-sm font-medium text-white">{schedule.client?.name ?? "Client"}</div>
                  <div className={`text-xs ${ui.muted}`}>{schedule.description || "Recurring invoice"}</div>
                </td>
                <td className="p-4 text-right text-sm text-white">{formatAmount(schedule.amount)}</td>
                <td className="p-4 text-sm text-gray-300">{schedule.frequency.toLowerCase()}</td>
                <td className="p-4 text-sm text-gray-300">{displayDate(schedule.nextRunDate)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <input
                      aria-label={`Generation time for ${schedule.client?.name ?? "client"}`}
                      type="time"
                      value={times[schedule.id] || DEFAULT_TIME}
                      disabled={!schedule.active}
                      onChange={(event) => setTimes((current) => ({
                        ...current,
                        [schedule.id]: event.target.value,
                      }))}
                      className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-sm text-white disabled:opacity-50"
                    />
                    {schedule.active && (
                      <Button type="button" variant="outline" size="sm" onClick={() => void saveTime(schedule)}>
                        Save
                      </Button>
                    )}
                  </div>
                  <span className={`mt-1 block text-[10px] ${ui.muted}`}>{displayTime(times[schedule.id] || schedule.scheduledTime)}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${schedule.active ? "text-emerald-400" : "text-gray-500"}`}>
                      {schedule.active ? "Active" : "Inactive"}
                    </span>
                    {schedule.active ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label="Pause recurring schedule"
                        onClick={() => void toggleActive(schedule)}
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Delete recurring schedule"
                      onClick={() => void deleteSchedule(schedule)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
