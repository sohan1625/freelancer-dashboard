import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Mail, Repeat, Send, Square, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/api";
import { getClients, type Client } from "@/lib/clients";
import { ds, tk } from "@/lib/ds";

type Frequency = "WEEKLY" | "MONTHLY" | "YEARLY";
type StartMode = "NOW" | "LATER";

interface RecurringInvoice {
  id: number;
  client: { id: number; name: string; email?: string | null } | null;
  description: string;
  amount: number;
  frequency: Frequency;
  nextRunDate: string;
  scheduledTime: string | null;
  active: boolean;
}

interface ScheduleForm {
  clientId: string;
  amount: string;
  frequency: Frequency;
  startMode: StartMode;
  startDate: string;
  scheduledTime: string;
  description: string;
}

const DEFAULT_TIME = "09:00";
const SCHEDULE_TIME_ZONE = "Asia/Kolkata";

const FREQUENCIES: { value: Frequency; label: string; every: string }[] = [
  { value: "WEEKLY", label: "Weekly", every: "every week" },
  { value: "MONTHLY", label: "Monthly", every: "every month" },
  { value: "YEARLY", label: "Yearly", every: "every year" },
];

/** Current date (YYYY-MM-DD) and time (HH:mm) in IST, the zone the backend schedules in. */
function nowInIst() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: SCHEDULE_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date()).map((part) => [part.type, part.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function emptyForm(): ScheduleForm {
  return {
    clientId: "",
    amount: "",
    frequency: "MONTHLY",
    startMode: "NOW",
    startDate: nowInIst().date,
    scheduledTime: DEFAULT_TIME,
    description: "",
  };
}

function displayTime(value: string | null | undefined) {
  const [hoursText, minutes] = (value || DEFAULT_TIME).split(":");
  const hours = Number(hoursText);
  return `${((hours + 11) % 12) + 1}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
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

function everyLabel(frequency: Frequency) {
  return FREQUENCIES.find((item) => item.value === frequency)?.every ?? frequency.toLowerCase();
}

export default function RecurringInvoicesPage() {
  const ui = tk(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [schedules, setSchedules] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<number | null>(null);
  const [editingTime, setEditingTime] = useState(DEFAULT_TIME);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);

  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const selectedClient = form.clientId ? clientsById.get(Number(form.clientId)) : undefined;
  const clientsWithEmail = clients.filter((client) => client.email?.trim());
  const amountValue = Number(form.amount);

  async function loadData() {
    setLoading(true);
    try {
      const [clientData, scheduleData] = await Promise.all([
        getClients(),
        apiGet<RecurringInvoice[]>("/api/recurring-invoices"),
      ]);
      setClients(clientData);
      setSchedules(scheduleData);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load recurring invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function update<K extends keyof ScheduleForm>(key: K, value: ScheduleForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) {
      toast.error("Choose who should receive the invoice.");
      return;
    }
    if (!(amountValue > 0)) {
      toast.error("Enter an amount greater than zero.");
      return;
    }

    const now = nowInIst();
    const sendNow = form.startMode === "NOW";
    const startDate = sendNow ? now.date : form.startDate;
    const scheduledTime = sendNow ? now.time : form.scheduledTime;
    if (!startDate || !scheduledTime) {
      toast.error("Pick the date and time for the first email.");
      return;
    }

    setCreating(true);
    try {
      const created = await apiPost<RecurringInvoice>("/api/recurring-invoices", {
        clientId: selectedClient.id,
        description: form.description.trim() || "Recurring invoice",
        amount: amountValue,
        frequency: form.frequency,
        startDate,
        scheduledTime: `${scheduledTime}:00`,
      });
      setSchedules((current) => [created, ...current]);
      setForm(emptyForm());
      toast.success(
        sendNow
          ? `The first invoice will be emailed to ${selectedClient.email} within a minute.`
          : `Scheduled. The first invoice goes to ${selectedClient.email} on ${displayDate(startDate)} at ${displayTime(scheduledTime)} IST.`,
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to set up the recurring invoice.");
    } finally {
      setCreating(false);
    }
  }

  async function saveTime(schedule: RecurringInvoice) {
    try {
      const updated = await apiPatch<RecurringInvoice>(`/api/recurring-invoices/${schedule.id}/time`, {
        scheduledTime: `${editingTime}:00`,
      });
      setSchedules((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingTimeId(null);
      toast.success(`Emails will now go out at ${displayTime(editingTime)} IST.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to change the send time.");
    }
  }

  async function stopSchedule(schedule: RecurringInvoice) {
    if (!window.confirm(`Stop sending this invoice to ${schedule.client?.name ?? "this client"}? You can't restart it later; you'd set up a new one.`)) {
      return;
    }
    try {
      await apiPatch(`/api/recurring-invoices/${schedule.id}/deactivate`);
      setSchedules((current) => current.map((item) => item.id === schedule.id ? { ...item, active: false } : item));
      toast.success("Stopped. No more emails will be sent for this one.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to stop the recurring invoice.");
    }
  }

  async function deleteSchedule(schedule: RecurringInvoice) {
    if (!window.confirm(`Delete the recurring invoice for ${schedule.client?.name ?? "this client"}? Invoices already sent are kept.`)) {
      return;
    }
    try {
      await apiDelete(`/api/recurring-invoices/${schedule.id}`);
      setSchedules((current) => current.filter((item) => item.id !== schedule.id));
      toast.success("Recurring invoice deleted.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete the recurring invoice.");
    }
  }

  const summary = selectedClient && amountValue > 0
    ? `${selectedClient.name} gets a ${formatAmount(amountValue)} invoice (PDF attached) at ${selectedClient.email}, ${everyLabel(form.frequency)}, ${
      form.startMode === "NOW"
        ? "starting right now."
        : `starting ${form.startDate ? displayDate(form.startDate) : "on the date you pick"} at ${displayTime(form.scheduledTime)} IST.`
    }`
    : null;

  const segment = (active: boolean) =>
    `flex-1 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors ${
      active
        ? "bg-[#ff5300] text-white"
        : "bg-[#151418] text-[#a1a1aa] hover:text-white border border-[rgba(255,255,255,0.08)]"
    }`;

  const activeSchedules = schedules.filter((schedule) => schedule.active);
  const stoppedSchedules = schedules.filter((schedule) => !schedule.active);

  return (
    <DashboardLayout title="Recurring invoices" subtitle="Email a client the same invoice on repeat">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-[#ff5300]/15 p-3 text-[#ff7b3d]">
            <Repeat size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={`${ds.font["2xl"]} ${ds.weight.semibold} ${ui.primary}`}>Recurring invoices</h1>
            <p className={`${ds.font.md} ${ui.muted}`}>
              Pick a client, an amount and how often. We create the invoice and email it to them with the PDF attached, automatically.
            </p>
          </div>
        </div>

        {!loading && clientsWithEmail.length === 0 ? (
          <div className={`${ui.card} mb-6 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center`}>
            <UserPlus className="h-5 w-5 shrink-0 text-[#ff7b3d]" />
            <p className={`flex-1 text-sm ${ui.secondary}`}>
              {clients.length === 0
                ? "Add a client first. Recurring invoices are emailed to a client's address."
                : "None of your clients has an email address yet. Add one so the invoice has somewhere to go."}
            </p>
            <Link to="/clients" className="rounded-[8px] bg-[#ff5300] px-4 py-2 text-sm font-semibold text-white hover:brightness-105">
              Go to clients
            </Link>
          </div>
        ) : (
          <form onSubmit={(event) => void createSchedule(event)} className={`${ui.card} mb-8 space-y-5 p-5`}>
            <label className="block space-y-1.5">
              <span className={`text-sm font-medium ${ui.secondary}`}>1. Who gets it?</span>
              <select
                required
                value={form.clientId}
                onChange={(event) => update("clientId", event.target.value)}
                className={`${ui.input} w-full`}
              >
                <option value="">Choose a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id} disabled={!client.email?.trim()}>
                    {client.name} {client.email?.trim() ? `(${client.email})` : "(no email, add one first)"}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className={`text-sm font-medium ${ui.secondary}`}>2. How much? (₹)</span>
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) => update("amount", event.target.value)}
                  className={`${ui.input} w-full`}
                  placeholder="5000"
                />
              </label>
              <label className="block space-y-1.5">
                <span className={`text-sm font-medium ${ui.secondary}`}>What's it for? <span className={ui.dim}>(optional)</span></span>
                <input
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  className={`${ui.input} w-full`}
                  placeholder="Monthly retainer"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <span className={`block text-sm font-medium ${ui.secondary}`}>3. How often?</span>
              <div className="flex gap-2" role="radiogroup" aria-label="How often">
                {FREQUENCIES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={form.frequency === item.value}
                    onClick={() => update("frequency", item.value)}
                    className={segment(form.frequency === item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className={`block text-sm font-medium ${ui.secondary}`}>4. When should the first one go out?</span>
              <div className="flex gap-2" role="radiogroup" aria-label="First email">
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.startMode === "NOW"}
                  onClick={() => update("startMode", "NOW")}
                  className={segment(form.startMode === "NOW")}
                >
                  Send first one now
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.startMode === "LATER"}
                  onClick={() => update("startMode", "LATER")}
                  className={segment(form.startMode === "LATER")}
                >
                  Pick a date
                </button>
              </div>
              {form.startMode === "LATER" && (
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className={`text-xs ${ui.muted}`}>Date</span>
                    <input
                      required
                      type="date"
                      min={nowInIst().date}
                      value={form.startDate}
                      onChange={(event) => update("startDate", event.target.value)}
                      className={`${ui.input} w-full`}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className={`text-xs ${ui.muted}`}>Time (India time, IST)</span>
                    <input
                      required
                      type="time"
                      value={form.scheduledTime}
                      onChange={(event) => update("scheduledTime", event.target.value)}
                      className={`${ui.input} w-full`}
                    />
                  </label>
                </div>
              )}
            </div>

            {summary && (
              <div className="flex gap-3 rounded-[10px] border border-[rgba(255,83,0,0.25)] bg-[rgba(255,83,0,0.08)] p-3.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7b3d]" />
                <p className={`text-sm ${ui.secondary}`}>{summary}</p>
              </div>
            )}

            <Button type="submit" disabled={creating || !selectedClient || !(amountValue > 0)} className={`${ui.btnPrimary} w-full sm:w-auto`}>
              <Send className="mr-2 h-4 w-4" />
              {creating ? "Setting up..." : form.startMode === "NOW" ? "Start & send first invoice" : "Schedule recurring invoice"}
            </Button>
          </form>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className={`text-base font-semibold ${ui.primary}`}>Sending automatically</h2>
          <Link to="/invoices" className="text-sm text-[#ff7b3d] hover:text-[#ffa071]">
            See sent invoices
          </Link>
        </div>

        {loading ? (
          <p className={`text-sm ${ui.muted}`}>Loading...</p>
        ) : activeSchedules.length === 0 ? (
          <div className={`${ui.card} p-5 text-sm ${ui.muted}`}>Nothing is set up to send yet.</div>
        ) : (
          <ul className="space-y-3">
            {activeSchedules.map((schedule) => {
              const email = schedule.client?.email || (schedule.client ? clientsById.get(schedule.client.id)?.email : undefined);
              return (
                <li key={schedule.id} className={`${ui.card} p-4`}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${ui.primary}`}>
                        {formatAmount(schedule.amount)} to {schedule.client?.name ?? "Client"}, {everyLabel(schedule.frequency)}
                      </p>
                      <p className={`mt-0.5 text-xs ${ui.muted}`}>
                        {schedule.description || "Recurring invoice"}
                        {email ? ` · ${email}` : ""}
                      </p>
                      {!email && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          This client has no email, so invoices are created but not sent.
                        </p>
                      )}
                      <p className={`mt-2 flex items-center gap-1.5 text-xs ${ui.secondary}`}>
                        <CalendarClock className="h-3.5 w-3.5 text-[#ff7b3d]" />
                        Next email: {displayDate(schedule.nextRunDate)} at {displayTime(schedule.scheduledTime)} IST
                        {editingTimeId !== schedule.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTimeId(schedule.id);
                              setEditingTime((schedule.scheduledTime || DEFAULT_TIME).slice(0, 5));
                            }}
                            className="ml-1 text-[#ff7b3d] hover:text-[#ffa071]"
                          >
                            Change time
                          </button>
                        )}
                      </p>
                      {editingTimeId === schedule.id && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            aria-label="New send time (IST)"
                            type="time"
                            value={editingTime}
                            onChange={(event) => setEditingTime(event.target.value)}
                            className={ui.input}
                          />
                          <Button type="button" size="sm" className={ui.btnPrimary} onClick={() => void saveTime(schedule)}>
                            Save
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setEditingTimeId(null)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => void stopSchedule(schedule)}>
                        <Square className="mr-1.5 h-3.5 w-3.5" />
                        Stop
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label="Delete recurring invoice"
                        onClick={() => void deleteSchedule(schedule)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {stoppedSchedules.length > 0 && (
          <div className="mt-8">
            <h2 className={`mb-3 text-sm font-semibold ${ui.muted}`}>Stopped</h2>
            <ul className="space-y-2">
              {stoppedSchedules.map((schedule) => (
                <li key={schedule.id} className={`${ui.card} flex items-center gap-3 p-3 opacity-70`}>
                  <p className={`flex-1 text-sm ${ui.secondary}`}>
                    {formatAmount(schedule.amount)} to {schedule.client?.name ?? "Client"}, {everyLabel(schedule.frequency)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Delete recurring invoice"
                    onClick={() => void deleteSchedule(schedule)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
