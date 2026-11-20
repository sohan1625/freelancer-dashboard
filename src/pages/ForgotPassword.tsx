import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowLeft, CheckCircle } from "lucide-react";
import { validateEmail } from "@/lib/validation";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const emailResult = validateEmail(email);
        if (!emailResult.valid) {
            setError(emailResult.error || "Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.message || "Something went wrong. Please try again.");
                return;
            }

            setSubmitted(true);
        } catch {
            setError("Could not reach the server. Is Spring Boot running?");
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
                        Happens to<br />the best of us.
                    </h1>
                    <p className="mt-4 text-zinc-400 text-lg">
                        We'll send you a link to reset<br />your password right away.
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

                    {submitted ? (
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="h-12 w-12 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900">Check your email</h2>
                            <p className="mt-2 text-sm text-zinc-500">
                                If an account exists for <span className="font-medium text-zinc-700">{email}</span>,
                                you'll receive a reset link shortly.
                            </p>
                            <p className="mt-2 text-xs text-zinc-400">
                                The link expires in 1 hour. Check your spam folder if you don't see it.
                            </p>
                            <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 hover:underline">
                                <ArrowLeft className="h-4 w-4" />
                                Back to login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition mb-6">
                                <ArrowLeft className="h-4 w-4" />
                                Back to login
                            </Link>

                            <h2 className="text-2xl font-bold text-zinc-900">Forgot password?</h2>
                            <p className="mt-1 text-sm text-zinc-500">
                                Enter your email and we'll send you a reset link.
                            </p>

                            {error && (
                                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition"
                                >
                                    {loading ? "Sending..." : "Send reset link"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
