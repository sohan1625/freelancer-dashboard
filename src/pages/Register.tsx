import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

type FormErrors = {
    username?: string;
    email?: string;
    password?: string;
};

function validate(name: string, email: string, password: string): FormErrors {
    const errors: FormErrors = {};

    if (!name.trim()) errors.username = "Username is required.";

    if (!email.trim()) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!password) {
        errors.password = "Password is required.";
    } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
    }

    return errors;
}

export default function RegisterPage() {
    const navigate = useNavigate();
    const auroraRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<HTMLCanvasElement>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [registerState, setRegisterState] = useState<"idle" | "loading" | "success">("idle");
    const [errors, setErrors] = useState<FormErrors>({});
    const [serverError, setServerError] = useState<string | null>(null);

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
            { x: 0.3, y: 0.2, r: 0.55, color: [180, 40, 20] as [number, number, number], speed: 0.0004, offset: 0 },
            { x: 0.7, y: 0.6, r: 0.5, color: [30, 80, 160] as [number, number, number], speed: 0.0003, offset: 1.5 },
            { x: 0.5, y: 0.85, r: 0.45, color: [15, 120, 90] as [number, number, number], speed: 0.0005, offset: 3 },
            { x: 0.15, y: 0.7, r: 0.4, color: [120, 20, 80] as [number, number, number], speed: 0.0004, offset: 4.5 },
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
                const [r, g, bl] = b.color;
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

    useEffect(() => {
        const canvas = particlesRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const NUM = 38;
        type Dot = { x: number; y: number; r: number; vx: number; vy: number; alpha: number };
        const dots: Dot[] = Array.from({ length: NUM }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.2 + 0.3,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            alpha: Math.random() * 0.4 + 0.1,
        }));

        let raf = 0;
        const draw = () => {
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            for (const d of dots) {
                d.x += d.vx;
                d.y += d.vy;
                if (d.x < 0) d.x = W;
                if (d.x > W) d.x = 0;
                if (d.y < 0) d.y = H;
                if (d.y > H) d.y = 0;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${d.alpha})`;
                ctx.fill();
            }

            for (let i = 0; i < dots.length; i++) {
                for (let j = i + 1; j < dots.length; j++) {
                    const dx = dots[i].x - dots[j].x;
                    const dy = dots[i].y - dots[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 70) {
                        ctx.beginPath();
                        ctx.moveTo(dots[i].x, dots[i].y);
                        ctx.lineTo(dots[j].x, dots[j].y);
                        ctx.strokeStyle = `rgba(255,255,255,${0.08 * (1 - dist / 70)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            raf = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    function clearFieldError(field: keyof FormErrors) {
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
        setServerError(null);
    }

    async function handleRegister() {
        if (registerState !== "idle") return;
        setServerError(null);

        const validationErrors = validate(name, email, password);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setRegisterState("loading");

        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
            });

            const text = await res.text();
            let data: any = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = { message: text || "Registration failed. Please try again." };
            }

            if (!res.ok) {
                setServerError(data.message || "Registration failed. Please try again.");
                setRegisterState("idle");
                return;
            }

            setRegisterState("success");
            toast.success("Account created! Please log in.");
            setTimeout(() => navigate("/login", { replace: true }), 500);
        } catch {
            setServerError("Could not reach the server. Is Spring Boot running?");
            setRegisterState("idle");
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#ebe6de]">
            <div
                className="grid min-h-screen w-full grid-cols-1 overflow-hidden lg:grid-cols-[46%_54%]"
                style={{ animation: "containerIn 0.8s cubic-bezier(0.16,1,0.3,1) both" }}
            >
                <div className="flex items-center justify-center bg-[#f3efe8] px-4 py-8 sm:px-8 lg:px-12">
                    <div className="flex w-full max-w-[460px] flex-col gap-0 rounded-[22px] bg-white px-8 py-8 shadow-[0_24px_70px_rgba(20,12,8,0.14)] sm:px-10 sm:py-9">
                    <div className="flex items-center gap-2 mb-8" style={{ animation: "fadeUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}>
                        <div
                            className="w-7 h-7 bg-[#1a1a1a] rounded-[7px] flex items-center justify-center"
                            style={{ animation: "iconPulse 3s ease-in-out infinite" }}
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
                                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" />
                            </svg>
                        </div>
                        <span className="text-[17px] font-semibold tracking-tight text-[#111111]">
                            Freelancer<span className="text-[#c1440e]">OS</span>
                        </span>
                    </div>

                    <h1
                        className="text-[28px] font-semibold tracking-tight text-[#111] mb-1.5"
                        style={{ animation: "fadeUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both" }}
                    >
                        Create Account
                    </h1>
                    <p
                        className="text-[13px] text-[#888] mb-6 leading-relaxed"
                        style={{ animation: "fadeUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both" }}
                    >
                        Start your multi-tenant workspace and manage your<br />freelance business with confidence.
                    </p>

                    {serverError ? (
                        <div className="mb-4 rounded-lg border border-[#f0b8a1] bg-[#fff4ef] px-3 py-2 text-[12px] text-[#a34722]">
                            {serverError}
                        </div>
                    ) : null}

                    <div
                        className="flex flex-col gap-3"
                        style={{ animation: "fadeUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
                    >
                        <div>
                            <label className="block text-[12px] font-medium text-[#555] mb-1">Username</label>
                            <div className="relative">
                                <svg className="absolute left-[11px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] stroke-[#aaa] fill-none pointer-events-none" viewBox="0 0 24 24" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        clearFieldError("username");
                                    }}
                                    placeholder="Choose a username"
                                    className="w-full pl-9 pr-3 py-[9px] border border-[#e3e3e3] rounded-[9px] text-[13.5px] text-[#222] bg-[#fafafa] outline-none transition-all focus:border-[#5DCAA5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(93,202,165,0.15)]"
                                    autoComplete="username"
                                />
                            </div>
                            {errors.username ? <p className="mt-1 text-xs text-[#a54e4e]">{errors.username}</p> : null}
                        </div>

                        <div>
                            <label className="block text-[12px] font-medium text-[#555] mb-1">Email</label>
                            <div className="relative">
                                <svg className="absolute left-[11px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] stroke-[#aaa] fill-none pointer-events-none" viewBox="0 0 24 24" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l8 6 8-6"/>
                                </svg>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        clearFieldError("email");
                                    }}
                                    placeholder="you@example.com"
                                    className="w-full pl-9 pr-3 py-[9px] border border-[#e3e3e3] rounded-[9px] text-[13.5px] text-[#222] bg-[#fafafa] outline-none transition-all focus:border-[#5DCAA5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(93,202,165,0.15)]"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email ? <p className="mt-1 text-xs text-[#a54e4e]">{errors.email}</p> : null}
                        </div>

                        <div>
                            <label className="block text-[12px] font-medium text-[#555] mb-1">Password</label>
                            <div className="relative">
                                <svg className="absolute left-[11px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] stroke-[#aaa] fill-none pointer-events-none" viewBox="0 0 24 24" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        clearFieldError("password");
                                    }}
                                    placeholder="Min. 6 characters"
                                    className="w-full pl-9 pr-14 py-[9px] border border-[#e3e3e3] rounded-[9px] text-[13.5px] text-[#222] bg-[#fafafa] outline-none transition-all focus:border-[#5DCAA5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(93,202,165,0.15)]"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-[11px] top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#5DCAA5] transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            {errors.password ? <p className="mt-1 text-xs text-[#a54e4e]">{errors.password}</p> : null}
                        </div>
                    </div>

                    <button
                        onClick={() => void handleRegister()}
                        disabled={registerState !== "idle"}
                        className="relative overflow-hidden w-full mt-4 py-[11px] text-white text-[14px] font-medium rounded-[10px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                        style={{
                            background: registerState === "success"
                                ? "linear-gradient(135deg,#1D9E75,#5DCAA5)"
                                : "linear-gradient(135deg,#c1440e 0%,#d4622e 50%,#c1440e 100%)",
                            backgroundSize: "200% 100%",
                            animation: "fadeUp 0.6s 0.45s cubic-bezier(0.16,1,0.3,1) both",
                            boxShadow: "0 6px 20px rgba(193,68,14,0.0)",
                            transition: "transform 0.2s, box-shadow 0.2s, background 0.4s",
                        }}
                        onMouseEnter={(e) => {
                            if (registerState === "idle") {
                                e.currentTarget.style.boxShadow = "0 6px 20px rgba(193,68,14,0.35)";
                                e.currentTarget.style.transform = "translateY(-1px)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(193,68,14,0)";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        {registerState === "idle" && (
                            <>
                                <span>Create Account</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                </svg>
                            </>
                        )}
                        {registerState === "loading" && (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.6s linear infinite" }}>
                                    <path strokeLinecap="round" d="M12 2a10 10 0 0110 10"/>
                                </svg>
                                <span>Creating account...</span>
                            </>
                        )}
                        {registerState === "success" && (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                                <span>Success!</span>
                            </>
                        )}
                    </button>

                    <p
                        className="text-center text-[12px] text-[#999] mt-4"
                        style={{ animation: "fadeUp 0.6s 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
                    >
                        Already have an account?{" "}
                        <Link to="/login" className="text-[#c1440e] font-medium no-underline">Sign in</Link>
                    </p>

                    <p
                        className="text-[11px] text-[#ccc] mt-auto pt-4"
                        style={{ animation: "fadeUp 0.6s 0.55s cubic-bezier(0.16,1,0.3,1) both" }}
                    >
                        © 2026 FreelancerOS
                    </p>
                    </div>
                </div>

                <div className="relative hidden overflow-hidden bg-[#0a0a14] lg:flex flex-col items-center justify-center px-8 py-10">
                    <canvas ref={auroraRef} className="absolute inset-0 w-full h-full opacity-90" style={{ display: "block" }} />

                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
                            backgroundSize: "32px 32px",
                        }}
                    />

                    <canvas ref={particlesRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ display: "block" }} />

                    <div
                        className="relative z-10 text-center mb-7"
                        style={{ animation: "fadeUp 0.8s 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
                    >
                        <h2 className="text-[26px] font-bold text-white tracking-tight leading-tight mb-2.5" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                            Growth-Ready Freelance<br />Workspace.
                        </h2>
                        <p className="text-[13px] text-white/50">
                            Built for quotes, invoices, projects, and reports in one place.
                        </p>
                    </div>

                    <div
                        className="relative z-10 w-full max-w-[280px] rounded-2xl text-left"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            backdropFilter: "blur(12px)",
                            padding: "1.2rem 1.4rem",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
                            animation: "cardFloat 6s ease-in-out infinite",
                        }}
                    >
                        <div className="text-[10px] text-white/35 uppercase tracking-[0.5px] mb-3">Workspace Setup</div>

                        <div className="flex justify-between items-start mb-2.5">
                            <div>
                                <div className="text-[9px] text-white/35 uppercase tracking-[0.5px]">Plan</div>
                                <div className="text-[15px] font-semibold text-white mt-0.5">Professional</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] text-white/35 uppercase tracking-[0.5px]">Workspace</div>
                                <div className="text-[13px] font-medium text-white/70 mt-0.5">#FOS-NEW</div>
                            </div>
                        </div>

                        <div className="h-px bg-white/[0.08] my-3" />

                        <div className="text-[9px] text-white/35 uppercase tracking-[0.5px]">Onboarding</div>
                        <div className="flex items-center justify-between mt-1">
                            <div className="text-[26px] font-bold text-white tracking-tight">3 Steps</div>
                            <div
                                className="text-[9px] font-semibold text-[#5DCAA5] px-2 py-1 rounded-full"
                                style={{
                                    background: "rgba(93,202,165,0.15)",
                                    border: "1px solid rgba(93,202,165,0.3)",
                                    animation: "badgePulse 2s ease-in-out infinite",
                                }}
                            >
                                Ready
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes containerIn {
                    from { opacity: 0; transform: translateY(24px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes iconPulse {
                    0%,100% { box-shadow: 0 0 0 0 rgba(26,26,26,0.2); }
                    50%      { box-shadow: 0 0 0 6px rgba(26,26,26,0); }
                }
                @keyframes cardFloat {
                    0%,100% { transform: translateY(0px) rotate(-0.5deg); }
                    50%      { transform: translateY(-8px) rotate(0.5deg); }
                }
                @keyframes badgePulse {
                    0%,100% { box-shadow: 0 0 0 0 rgba(93,202,165,0.3); }
                    50%      { box-shadow: 0 0 0 4px rgba(93,202,165,0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
