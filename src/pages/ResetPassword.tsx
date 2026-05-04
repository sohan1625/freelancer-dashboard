import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Zap, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    function validate(): boolean {
        const newErrors: { email?: string; password?: string; confirm?: string } = {};
        if (!email) {
            newErrors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Please enter a valid email address.";
        }
        if (!password) {
            newErrors.password = "Password is required.";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters.";
        }
        if (!confirm) {
            newErrors.confirm = "Please confirm your password.";
        } else if (password !== confirm) {
            newErrors.confirm = "Passwords do not match.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        if (!token) {
            setServerError("Invalid reset link. Please request a new one.");
            return;
        }

        if (!validate()) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.message || "Failed to reset password. Please try again.");
                return;
            }

            setSuccess(true);
            toast.success("Password reset successfully.");
            setTimeout(() => navigate("/login"), 2000);
        } catch {
            setServerError("Could not reach the server. Is Spring Boot running?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen">
            <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 flex-col justify-between p-12">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                        <Zap className="h-4 w-4 text-zinc-950" />
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">FreelancerOS</span>
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Almost there.<br />Set a new password.
                    </h1>
                    <p className="mt-4 text-zinc-400 text-lg">
                        Choose something strong<br />and don't forget it this time.
                    </p>
                </div>
                <p className="text-zinc-600 text-xs">© 2026 FreelancerOS</p>
            </div>

            <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950">
                            <Zap className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="font-bold text-zinc-900">FreelancerOS</span>
                    </div>

                    {!token ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-zinc-900">Invalid link</h2>
                            <p className="mt-2 text-sm text-zinc-500">
                                This reset link is invalid or has expired.
                            </p>
                            <Link to="/forgot-password" className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline">
                                Request a new reset link
                            </Link>
                        </div>
                    ) : success ? (
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="h-12 w-12 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900">Password reset!</h2>
                            <p className="mt-2 text-sm text-zinc-500">Redirecting you to login...</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-zinc-900">Set new password</h2>
                            <p className="mt-1 text-sm text-zinc-500">Must be at least 6 characters.</p>

                            {serverError && (
                                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                                    {serverError}
                                    {serverError.includes("expired") && (
                                        <span> <Link to="/forgot-password" className="underline font-medium">Request a new one.</Link></span>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition ${errors.email ? "border-red-400" : "border-zinc-200"}`}
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                                        autoComplete="email"
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Min. 6 characters"
                                        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition ${errors.password ? "border-red-400" : "border-zinc-200"}`}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                                        autoComplete="new-password"
                                    />
                                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="Repeat your password"
                                        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition ${errors.confirm ? "border-red-400" : "border-zinc-200"}`}
                                        value={confirm}
                                        onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
                                        autoComplete="new-password"
                                    />
                                    {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition"
                                >
                                    {loading ? "Resetting..." : <><span>Reset password</span><ArrowRight className="h-4 w-4" /></>}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
