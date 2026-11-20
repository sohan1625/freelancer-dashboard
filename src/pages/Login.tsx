
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validateEmail } from "@/lib/validation";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export default function LoginPage() {
    const navigate = useNavigate();
    const auroraRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<HTMLCanvasElement>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(true);
    const [loginState, setLoginState] = useState<"idle" | "loading" | "success">("idle");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const canvas = auroraRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        resize();
        window.addEventListener("resize", resize);

        const blobs = [
            { x: 0.3, y: 0.2, r: 0.55, color: [180, 40, 20], speed: 0.0004, offset: 0 },
            { x: 0.7, y: 0.6, r: 0.5, color: [30, 80, 160], speed: 0.0003, offset: 1.5 },
            { x: 0.5, y: 0.85, r: 0.45, color: [15, 120, 90], speed: 0.0005, offset: 3 },
            { x: 0.15, y: 0.7, r: 0.4, color: [120, 20, 80], speed: 0.0004, offset: 4.5 },
        ];

        let t = 0;
        let raf = 0;

        const draw = () => {
            t += 16;

            const W = canvas.width;
            const H = canvas.height;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = "#0a0a14";
            ctx.fillRect(0, 0, W, H);

            for (const b of blobs) {
                const px = (b.x + Math.sin(t * b.speed + b.offset) * 0.18) * W;
                const py = (b.y + Math.cos(t * b.speed * 0.7 + b.offset) * 0.18) * H;
                const radius = b.r * Math.max(W, H);

                const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
                const [r, g, bl] = b.color as number[];

                grad.addColorStop(0, `rgba(${r},${g},${bl},0.28)`);
                grad.addColorStop(0.5, `rgba(${r},${g},${bl},0.1)`);
                grad.addColorStop(1, `rgba(${r},${g},${bl},0)`);

                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);
            }

            raf = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    const handleLogin = async () => {
        if (loginState !== "idle") return;

        const trimmedIdentifier = email.trim();
        if (!trimmedIdentifier) {
            setError("Email or username is required.");
            return;
        }

        if (trimmedIdentifier.includes("@")) {
            const emailRes = validateEmail(trimmedIdentifier);
            if (!emailRes.valid) {
                setError(emailRes.error || "Please enter a valid email address.");
                return;
            }
        }

        if (!password) {
            setError("Password is required.");
            return;
        }

        setError(null);
        setLoginState("loading");

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Invalid credentials");
                setLoginState("idle");
                return;
            }

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            if (data.name) {
                localStorage.setItem("userDisplayName", data.name);
            }

            setLoginState("success");

            setTimeout(() => {
                navigate("/", { replace: true });
            }, 500);
        } catch {
            setError("Server error. Try again.");
            setLoginState("idle");
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#ebe6de]">
            <div className="grid min-h-screen w-full grid-cols-1 overflow-hidden lg:grid-cols-[46%_54%]">

                <div className="flex items-center justify-center bg-[#f3efe8] px-4 py-8 sm:px-8 lg:px-12">
                    <div className="flex w-full max-w-[460px] flex-col rounded-[22px] bg-white px-8 py-8 shadow-[0_24px_70px_rgba(20,12,8,0.14)] sm:px-10 sm:py-9">

                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-7 h-7 bg-[#1a1a1a] rounded-[7px] flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
                                    <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" />
                                </svg>
                            </div>

                            <span className="text-[17px] font-semibold tracking-tight text-[#111111]">
                                Freelancer<span className="text-[#c1440e]">OS</span>
                            </span>
                        </div>

                        <h1 className="text-[28px] font-semibold tracking-tight text-[#111] mb-1.5">
                            Login
                        </h1>

                        <p className="text-[13px] text-[#888] mb-6 leading-relaxed">
                            Access your multi-tenant workspace and manage your freelance business seamlessly.
                        </p>

                        {error && (
                            <div className="mb-4 rounded-lg border border-[#f0b8a1] bg-[#fff4ef] px-3 py-2 text-[12px] text-[#a34722]">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-[12px] font-medium text-[#555] mb-1">
                                    Email / Username
                                </label>

                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-3 py-[9px] border border-[#e3e3e3] rounded-[9px] text-[13.5px] text-[#111111] placeholder:text-[#9a9a9a] bg-[#fafafa] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-[#555] mb-1">
                                    Password
                                </label>

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-3 py-[9px] border border-[#e3e3e3] rounded-[9px] text-[13.5px] text-[#111111] placeholder:text-[#9a9a9a] bg-[#fafafa] outline-none"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#888]"
                                    >
                                        {showPassword ? "hide" : "show"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 mb-0">
                            <label className="flex items-center gap-1.5 text-[12px] text-[#666] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="accent-[#5DCAA5]"
                                />
                                Remember me
                            </label>

                            <Link to="/forgot-password" className="text-[12px] text-[#888] underline underline-offset-2">
                                Forgot password
                            </Link>
                        </div>

                        <button
                            onClick={() => void handleLogin()}
                            disabled={loginState !== "idle"}
                            className="relative overflow-hidden w-full mt-4 py-[11px] text-white text-[14px] font-medium rounded-[10px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                            style={{
                                backgroundImage: loginState === "success"
                                    ? "linear-gradient(135deg,#1D9E75,#5DCAA5)"
                                    : "linear-gradient(135deg,#c1440e 0%,#d4622e 50%,#c1440e 100%)",
                                backgroundSize: "200% 100%",
                                backgroundRepeat: "no-repeat",
                                boxShadow: "0 6px 20px rgba(193,68,14,0.0)",
                                transition: "transform 0.2s, box-shadow 0.2s, background-image 0.4s",
                            }}
                        >
                            {loginState === "idle" && <span>Login</span>}
                            {loginState === "loading" && <span>Signing in...</span>}
                            {loginState === "success" && <span>Success!</span>}
                        </button>

                        <p className="text-center text-[12px] text-[#999] mt-4">
                            Don&apos;t have an account?{" "}
                            <Link to="/register" className="text-[#c1440e] font-medium no-underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-[#0d0b14]">
                    <canvas ref={auroraRef} className="absolute inset-0 w-full h-full" />

                    <canvas ref={particlesRef} className="absolute inset-0 w-full h-full opacity-60" />

                    <div className="relative z-10 max-w-[520px] px-12 text-white">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-1.5 text-[12px] text-white/80 backdrop-blur-md mb-6">
                            FreelancerOS Platform
                        </div>

                        <h2 className="text-[42px] leading-[1.05] font-semibold tracking-tight mb-5">
                            Manage clients, invoices, and revenue in one workspace.
                        </h2>

                        <p className="text-[15px] leading-relaxed text-white/70 max-w-[460px]">
                            Built for freelancers who need a modern workspace with analytics,
                            automation, recurring invoices, expenses, and secure multi-tenant management.
                        </p>

                        <div className="mt-8 flex gap-3">
                            <Link
                                to="/register"
                                className="rounded-[10px] bg-white text-black px-5 py-3 text-[13px] font-medium"
                            >
                                Create Account
                            </Link>

                            <div className="rounded-[10px] border border-[rgba(255,255,255,0.15)] px-5 py-3 text-[13px] text-white/75">
                                SaaS Dashboard
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

