import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ds, tk, pill } from "@/lib/ds";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { getClients, type Client as ApiClient } from "@/lib/clients";
import { toast } from "sonner";

type ProjectStatus = "active" | "completed" | "paused" | "draft";

type ProjectApi = {
  id: number;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  deadline?: string;
  budget?: number;
  client?: { id: number; name: string };
};

type Project = {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  budget: number;
  startDate: string;
  dueDate: string;
};

type NewProjectForm = {
  clientId: string;
  name: string;
  description: string;
  budget: string;
  startDate: string;
  dueDate: string;
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function mapStatus(status: string): ProjectStatus {
  const s = String(status || "").toUpperCase();
  if (s === "ACTIVE") return "active";
  if (s === "COMPLETED") return "completed";
  if (s === "ON_HOLD") return "paused";
  return "draft";
}

function statusValueForApi(status: ProjectStatus) {
  if (status === "paused") return "ON_HOLD";
  return status.toUpperCase();
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const p = pill(status === "paused" ? "pending" : status === "completed" ? "paid" : status === "draft" ? "draft" : "pending", true);
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border" style={{ backgroundColor: p.bg, color: p.text, borderColor: p.border }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ProjectsPage() {
  const ui = tk(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NewProjectForm>({
    clientId: "",
    name: "",
    description: "",
    budget: "",
    startDate: "",
    dueDate: "",
  });

  async function loadAll() {
    setLoading(true);
    try {
      const [projectData, clientData] = await Promise.all([
        apiGet<ProjectApi[]>("/api/projects"),
        getClients(),
      ]);

      setProjects(
        projectData.map((p) => ({
          id: String(p.id),
          name: p.name,
          client: p.client?.name ?? "Client",
          status: mapStatus(p.status),
          budget: Number(p.budget ?? 0),
          startDate: p.startDate ?? "",
          dueDate: p.deadline ?? "",
        }))
      );
      setClients(clientData);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const statusMatch = filter === "all" || p.status === filter;
      const q = search.toLowerCase();
      const searchMatch = !q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
      return statusMatch && searchMatch;
    });
  }, [projects, filter, search]);

  const counts = {
    all: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    completed: projects.filter((p) => p.status === "completed").length,
    paused: projects.filter((p) => p.status === "paused").length,
    draft: projects.filter((p) => p.status === "draft").length,
  };

  const handleCreateProject = async () => {
    if (!form.clientId) {
      toast.error("Select a client.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Project name is required.");
      return;
    }

    setCreating(true);
    try {
      const created = await apiPost<ProjectApi>(`/api/projects/client/${form.clientId}`, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        startDate: form.startDate || undefined,
        deadline: form.dueDate || undefined,
        status: statusValueForApi("active"),
      });

      setProjects((prev) => [
        {
          id: String(created.id),
          name: created.name,
          client: clients.find((c) => String(c.id) === form.clientId)?.name ?? "Client",
          status: mapStatus(created.status),
          budget: Number(created.budget ?? 0),
          startDate: created.startDate ?? "",
          dueDate: created.deadline ?? "",
        },
        ...prev,
      ]);

      setShowCreate(false);
      setForm({ clientId: "", name: "", description: "", budget: "", startDate: "", dueDate: "" });
      toast.success("Project created.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout
      title="Projects"
      subtitle={`${counts.active} active · ${counts.completed} completed`}
      headerActions={
        <button className="px-4 py-2 rounded-md bg-[#5DCAA5] text-black text-sm font-semibold" onClick={() => setShowCreate(true)}>
          + New Project
        </button>
      }
    >
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111] border border-[rgba(255,255,255,0.12)] rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Create Project</h2>

            <div className="space-y-3">
              <select value={form.clientId} onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))} className={ui.input}>
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>

              <input placeholder="Project name" className={ui.input} value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              <input placeholder="Description" className={ui.input} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
              <input type="number" placeholder="Budget" className={ui.input} value={form.budget} onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))} />

              <div className="grid grid-cols-2 gap-3">
                <input type="date" className={ui.input} value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
                <input type="date" className={ui.input} value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => void handleCreateProject()} disabled={creating} className={ui.btnPrimary}>
                {creating ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "active", "completed", "paused", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${filter === s ? "bg-[#222] text-white" : ui.muted + " hover:text-white"}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <input
          placeholder="Search projects..."
          className={ui.input + " w-64"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={`${ui.card} overflow-hidden`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-[11px] uppercase tracking-wider ${ui.muted} border-b ${ui.divider}`}>
              <th className="p-4 font-medium">Project</th>
              <th className="p-4 font-medium">Client</th>
              <th className="p-4 font-medium text-right">Budget</th>
              <th className="p-4 font-medium">Start</th>
              <th className="p-4 font-medium">Due</th>
              <th className="p-4 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-sm text-gray-400" colSpan={6}>Loading projects...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-4 text-sm text-gray-400" colSpan={6}>No projects found.</td></tr>
            ) : (
              <AnimatePresence>
                {filtered.map((p) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`border-b ${ui.divider} last:border-0`}>
                    <td className="p-4 text-sm text-white font-medium">{p.name}</td>
                    <td className="p-4 text-sm text-gray-300">{p.client}</td>
                    <td className="p-4 text-sm text-right text-white">{fmt(p.budget)}</td>
                    <td className="p-4 text-sm text-gray-300">{p.startDate || "-"}</td>
                    <td className="p-4 text-sm text-gray-300">{p.dueDate || "-"}</td>
                    <td className="p-4 text-center"><ProjectStatusBadge status={p.status} /></td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
