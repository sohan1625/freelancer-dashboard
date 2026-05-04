import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

// ─── Types ────────────────────────────────────────────────────────────────────

type Invoice = {
    id: number;
    amount: number;
    status: string;
    dueDate: string;
    description?: string;
};

type PortalData = {
    clientName: string;
    clientEmail: string;
    invoices: Invoice[];
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    if (s === "paid") return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      <CheckCircle className="h-3 w-3" /> Paid
    </span>
    );
    if (s === "overdue") return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      <AlertCircle className="h-3 w-3" /> Overdue
    </span>
    );
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClientPortal() {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<PortalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE}/api/portal/${token}`)
            .then((res) => {
                if (res.status === 404) { setNotFound(true); return null; }
                return res.json();
            })
            .then((json) => { if (json) setData(json); })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-sm">Loading your invoices...</p>
            </div>
        );
    }

    if (notFound || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800">Portal not found</p>
                    <p className="text-sm text-gray-500 mt-1">This link may be invalid or expired.</p>
                </div>
            </div>
        );
    }

    const totalDue = data.invoices
        .filter((i) => i.status.toLowerCase() !== "paid")
        .reduce((sum, i) => sum + i.amount, 0);

    const totalPaid = data.invoices
        .filter((i) => i.status.toLowerCase() === "paid")
        .reduce((sum, i) => sum + i.amount, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm">
                            {data.clientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">{data.clientName}</h1>
                            <p className="text-sm text-gray-500">{data.clientEmail}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border p-4">
                        <p className="text-xs text-gray-500 mb-1">Amount Due</p>
                        <p className="text-2xl font-bold text-red-600">
                            ₹{totalDue.toLocaleString("en-IN")}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                        <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                            ₹{totalPaid.toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>

                {/* Invoices */}
                <div className="bg-white rounded-xl border">
                    <div className="flex items-center gap-2 px-5 py-4 border-b">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <h2 className="font-semibold text-gray-800">Invoices</h2>
                        <span className="ml-auto text-xs text-gray-400">{data.invoices.length} total</span>
                    </div>

                    {data.invoices.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-gray-400">
                            No invoices yet.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {data.invoices.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between px-5 py-4">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-gray-800">
                                            Invoice #{inv.id}
                                        </p>
                                        {inv.description && (
                                            <p className="text-xs text-gray-400">{inv.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400">Due: {inv.dueDate}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm font-semibold text-gray-800">
                                            ₹{inv.amount.toLocaleString("en-IN")}
                                        </p>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400">
                    Powered by FreelancerOS
                </p>
            </div>
        </div>
    );
}
