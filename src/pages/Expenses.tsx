import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Receipt, Trash2, Search, FileText } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";

// IMPORTANT: Adjust this import path to point to your actual design system file
import { ds, tk, pill } from "@/lib/ds";

// ─── Types ────────────────────────────────────────────────────────────────────

type Project = {
    id: number;
    name: string;
};

type Expense = {
    id: number;
    name: string;
    description?: string;
    category: string;
    amount: number;
    date: string;
    project?: Project;
    status?: "paid" | "pending"; // Aligning with your pill() function
};

type ExpenseForm = {
    name: string;
    description: string;
    category: string;
    amount: string;
    date: string;
    projectId: string;
};

const EMPTY_FORM: ExpenseForm = {
    name: "",
    description: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    projectId: "none",
};

const CATEGORIES = ["FOOD", "TRAVEL", "SOFTWARE", "OFFICE", "MARKETING", "OTHER"];

// Map categories directly to your design system colors
const CATEGORY_COLORS: Record<string, string> = {
    FOOD: ds.color.orange,
    TRAVEL: ds.color.blue,
    SOFTWARE: ds.color.green,
    OFFICE: ds.color.red,
    MARKETING: ds.color.orange,
    OTHER: ds.dark.text.muted,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(value: number): string {
    return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function validateForm(form: ExpenseForm): Partial<ExpenseForm> {
    const errors: Partial<ExpenseForm> = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.category) errors.category = "Select a category.";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
        errors.amount = "Enter a valid amount.";
    if (!form.date) errors.date = "Select a date.";
    return errors;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Expenses() {
    // Enable dark mode tokens
    const dark = true;
    const ui = tk(dark);

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [showDialog, setShowDialog] = useState(false);
    const [form, setForm] = useState<ExpenseForm>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<Partial<ExpenseForm>>({});
    const [saving, setSaving] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    useEffect(() => {
        void loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [exp, proj] = await Promise.all([
                apiGet<Expense[]>("/api/expenses"),
                apiGet<Project[]>("/api/projects"),
            ]);
            // Mocking status if backend doesn't provide it yet
            const enrichedExp = exp.map(e => ({ ...e, status: e.status || "paid" }));
            setExpenses(enrichedExp as Expense[]);
            setProjects(proj);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Failed to load expenses.");
        } finally {
            setLoading(false);
        }
    }

    // ── Dynamic Analytics Calculations ──
    const { total, categoryData, filteredExpenses } = useMemo(() => {
        const currentTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Calculate Category Breakdown dynamically
        const categoryMap = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
            return acc;
        }, {} as Record<string, number>);

        const calculatedCategories = Object.entries(categoryMap).map(([name, amount]) => ({
            name,
            amount,
            percentage: currentTotal > 0 ? (amount / currentTotal) * 100 : 0,
            color: CATEGORY_COLORS[name] || CATEGORY_COLORS.OTHER,
        })).sort((a, b) => b.amount - a.amount);

        // Handle Search Filtering
        const filtered = expenses.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return { total: currentTotal, categoryData: calculatedCategories, filteredExpenses: filtered };
    }, [expenses, searchTerm]);

    // ── Create & Delete Handlers ──
    function openDialog() {
        setForm(EMPTY_FORM);
        setFormErrors({});
        setShowDialog(true);
    }

    function handleField(field: keyof ExpenseForm, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    async function handleCreate() {
        const errors = validateForm(form);
        if (Object.keys(errors).length > 0) return setFormErrors(errors);

        setSaving(true);
        try {
            const hasProject = form.projectId && form.projectId !== "none";
            const url = hasProject ? `/api/expenses?projectId=${form.projectId}` : "/api/expenses";
            const newExpense = await apiPost<Expense>(url, {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                category: form.category,
                amount: parseFloat(form.amount),
                date: form.date,
            });
            setExpenses((prev) => [{ ...newExpense, status: "paid" }, ...prev]);
            setShowDialog(false);
            toast.success("Expense added successfully.");
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Failed to add expense.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        setDeleteTargetId(null);
        try {
            await apiDelete(`/api/expenses/${id}`);
            setExpenses((prev) => prev.filter((e) => e.id !== id));
            toast.success("Expense deleted.");
        } catch (err) {
            toast.error("Failed to delete expense.");
        }
    }

    return (
        <DashboardLayout title="Expenses">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className={`${ds.font["2xl"]} ${ds.weight.semibold} ${ui.primary} tracking-tight`}>Expenses</h1>
                    <p className={`${ds.font.sm} ${ui.muted} mt-1`}>Track and categorize your spending</p>
                </div>
                <Button onClick={openDialog} className={ui.btnPrimary}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Expense
                </Button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className={`h-24 w-full ${ds.radius.lg} ${ui.card}`} />)}
                    </div>
                </div>
            ) : expenses.length === 0 ? (
                <div className={`flex flex-col items-center justify-center gap-4 ${ds.radius.lg} border border-dashed ${ui.divider} p-12 text-center`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: ui.t.bgElevated }}>
                        <Receipt className={`h-6 w-6 ${ui.muted}`} />
                    </div>
                    <div>
                        <p className={`${ds.font.md} ${ds.weight.semibold} ${ui.primary}`}>No expenses logged</p>
                        <p className={`${ds.font.sm} ${ui.muted} mt-1`}>Keep track of your business spending.</p>
                    </div>
                    <Button size="sm" onClick={openDialog} className={ui.btnPrimary}>
                        <Plus className="mr-2 h-4 w-4" /> Add First Expense
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">

                    {/* ── Top Summary Cards ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`${ui.card} p-5 flex flex-col justify-between`}>
                            <h3 className={`${ds.font.xs} ${ds.weight.medium} ${ui.muted} uppercase tracking-wider`}>Total Expenses</h3>
                            <div className="mt-4 flex items-end justify-between">
                                <span className={`${ds.font["3xl"]} ${ds.weight.semibold} ${ui.primary}`}>{formatINR(total)}</span>
                                <Receipt className={`w-5 h-5 ${ui.dim} mb-1`} />
                            </div>
                        </div>
                        <div className={`${ui.card} p-5 flex flex-col justify-between`}>
                            <h3 className={`${ds.font.xs} ${ds.weight.medium} ${ui.muted} uppercase tracking-wider`}>Top Category</h3>
                            <div className="mt-4 flex items-end justify-between">
                                <span className={`${ds.font["3xl"]} ${ds.weight.semibold} ${ui.primary}`}>
                                    {categoryData.length > 0 ? formatINR(categoryData[0].amount) : "₹0"}
                                </span>
                                <span className={`${ds.font.sm} ${ds.weight.medium} ${ui.secondary} mb-1`}>
                                    {categoryData.length > 0 ? categoryData[0].name : "-"}
                                </span>
                            </div>
                        </div>
                        <div className={`${ui.card} p-5 flex flex-col justify-between`}>
                            <h3 className={`${ds.font.xs} ${ds.weight.medium} ${ui.muted} uppercase tracking-wider`}>Transaction Count</h3>
                            <div className="mt-4 flex items-end justify-between">
                                <span className={`${ds.font["3xl"]} ${ds.weight.semibold} ${ui.primary}`}>{expenses.length}</span>
                                <FileText className={`w-5 h-5 ${ui.dim} mb-1`} />
                            </div>
                        </div>
                    </div>

                    {/* ── Category Visual Breakdown ── */}
                    <div className={`${ui.card} p-6`}>
                        <h3 className={`${ds.font.sm} ${ds.weight.medium} ${ui.primary} mb-4`}>Spend by Category</h3>

                        {/* Progress Bar Layer */}
                        <div className={`w-full h-3 flex ${ds.radius.full} overflow-hidden mb-4`} style={{ backgroundColor: ui.barEmpty }}>
                            {categoryData.map((cat, idx) => (
                                <div key={idx} className="h-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                            ))}
                        </div>

                        {/* Legend Layer */}
                        <div className="flex flex-wrap gap-6 mt-4">
                            {categoryData.map((cat, idx) => (
                                <div key={idx} className="flex items-center">
                                    <div className={`w-2.5 h-2.5 ${ds.radius.full} mr-2`} style={{ backgroundColor: cat.color }} />
                                    <span className={`${ds.font.sm} ${ui.secondary} mr-2`}>{cat.name}</span>
                                    <span className={`${ds.font.sm} ${ui.primary} ${ds.weight.medium}`}>{formatINR(cat.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Filter & Search ── */}
                    <div className="flex justify-between items-center">
                        <h3 className={`${ds.font.md} ${ds.weight.medium} ${ui.primary}`}>Recent Transactions</h3>
                        <div className="relative">
                            <Search className={`w-4 h-4 ${ui.muted} absolute left-3 top-1/2 transform -translate-y-1/2`} />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`${ui.input} pl-9 w-64`}
                            />
                        </div>
                    </div>

                    {/* ── Expense Table List ── */}
                    <div className={`${ui.card} overflow-hidden`}>
                        <AnimatePresence initial={false}>
                            {filteredExpenses.map((expense) => {
                                const catColor = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.OTHER;
                                const statusPill = pill(expense.status || "paid", dark);

                                return (
                                    <motion.div
                                        key={expense.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`border-b ${ui.divider} last:border-0 p-4 flex items-center justify-between ${ui.cardHover}`}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            {/* Category Icon */}
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center ${ds.radius.md} ${ds.font.xs} ${ds.weight.bold}`}
                                                style={{ backgroundColor: `${catColor}20`, color: catColor }} // Added 20 to hex for opacity
                                            >
                                                {expense.category.slice(0, 2)}
                                            </div>

                                            {/* Text Details */}
                                            <div className="min-w-0">
                                                <p className={`${ds.font.md} ${ds.weight.medium} ${ui.primary} truncate`}>{expense.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`${ds.font.xs} ${ui.muted}`}>{expense.date}</span>
                                                    {expense.project && (
                                                        <span className={`${ds.font.xs} ${ui.muted}`}>· {expense.project.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 shrink-0">
                                            {/* Status Badge from your Design System */}
                                            <span
                                                className={`px-2 py-1 ${ds.radius.full} ${ds.font.xs} border`}
                                                style={{ backgroundColor: statusPill.bg, color: statusPill.text, borderColor: statusPill.border }}
                                            >
                                                {expense.status}
                                            </span>

                                            <p className={`${ds.font.md} ${ds.weight.medium} ${ui.primary}`}>
                                                {formatINR(Number(expense.amount))}
                                            </p>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className={`h-8 w-8 hover:bg-[rgba(240,82,82,0.1)] text-[#a1a1aa] hover:text-[#F05252] transition-colors`}
                                                onClick={() => setDeleteTargetId(expense.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        {filteredExpenses.length === 0 && (
                            <div className={`p-8 text-center ${ds.font.sm} ${ui.muted}`}>
                                No expenses found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Dialogs ── */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className={`${ui.card} sm:max-w-[425px]`}>
                    <DialogHeader>
                        <DialogTitle className={ui.primary}>Add Expense</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label className={ui.secondary}>Name</Label>
                            <input
                                className={`${ui.input} w-full`}
                                placeholder="e.g., Claude Subscription"
                                value={form.name}
                                onChange={(e) => handleField("name", e.target.value)}
                            />
                            {formErrors.name && <p className="text-xs text-[#F05252] mt-1">{formErrors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className={ui.secondary}>Category</Label>
                                <Select value={form.category} onValueChange={(v) => handleField("category", v)}>
                                    <SelectTrigger className={`${ui.input} w-full flex items-center justify-between`}>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className={ui.card}>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat} className={`${ui.primary} hover:bg-[#141414] focus:bg-[#141414] cursor-pointer`}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.category && <p className="text-xs text-[#F05252] mt-1">{formErrors.category}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label className={ui.secondary}>Amount (₹)</Label>
                                <input
                                    className={`${ui.input} w-full`}
                                    type="number"
                                    min="1"
                                    placeholder="2500"
                                    value={form.amount}
                                    onChange={(e) => handleField("amount", e.target.value)}
                                />
                                {formErrors.amount && <p className="text-xs text-[#F05252] mt-1">{formErrors.amount}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className={ui.secondary}>Date</Label>
                                <input
                                    className={`${ui.input} w-full`}
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => handleField("date", e.target.value)}
                                />
                                {formErrors.date && <p className="text-xs text-[#F05252] mt-1">{formErrors.date}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label className={ui.secondary}>Project <span className={ui.muted}>(opt)</span></Label>
                                <Select value={form.projectId} onValueChange={(v) => handleField("projectId", v)}>
                                    <SelectTrigger className={`${ui.input} w-full flex items-center justify-between`}>
                                        <SelectValue placeholder="Link project" />
                                    </SelectTrigger>
                                    <SelectContent className={ui.card}>
                                        <SelectItem value="none" className={`${ui.primary} hover:bg-[#141414] focus:bg-[#141414] cursor-pointer`}>No project</SelectItem>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)} className={`${ui.primary} hover:bg-[#141414] focus:bg-[#141414] cursor-pointer`}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className={ui.secondary}>Description <span className={ui.muted}>(optional)</span></Label>
                            <input
                                className={`${ui.input} w-full`}
                                placeholder="Additional notes"
                                value={form.description}
                                onChange={(e) => handleField("description", e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" className={ui.btnGhost} onClick={() => setShowDialog(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button className={ui.btnPrimary} onClick={handleCreate} disabled={saving}>
                            {saving ? "Adding..." : "Add Expense"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
                <AlertDialogContent className={ui.card}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={ui.primary}>Delete Expense</AlertDialogTitle>
                        <AlertDialogDescription className={ui.muted}>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className={ui.btnGhost}>Cancel</AlertDialogCancel>
                        <AlertDialogAction className={ui.btnDanger} onClick={() => deleteTargetId !== null && handleDelete(deleteTargetId)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}