
import {
  LayoutDashboard, FileText, Users,
  FolderOpen, Receipt, BarChart3, Settings, LogOut,
  Zap, Repeat,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ds, tk } from "@/lib/ds";
import { apiGet } from "@/lib/api";

function handleLogout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userDisplayName");
  window.location.href = "/login";
}

const navMain = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Invoices", icon: FileText, path: "/invoices", alert: true },
  { label: "Recurring", icon: Repeat, path: "/recurring-invoices" },
  { label: "Clients", icon: Users, path: "/clients" },
  { label: "Projects", icon: FolderOpen, path: "/projects" },
  { label: "Expenses", icon: Receipt, path: "/expenses" },
];

const navSecondary = [
  { label: "Analytics", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar({ theme }: { theme: "dark" | "light" }) {
  const dark = theme === "dark";
  const t = tk(dark);

  const [invoiceCount, setInvoiceCount] = useState<number>(0);
  const [userDisplayName, setUserDisplayName] = useState("User");

  useEffect(() => {
    async function loadInvoiceCount() {
      try {
        const invoices = await apiGet<Array<{ id: number }>>("/api/clients/invoices");
        setInvoiceCount(invoices.length);
      } catch {
        setInvoiceCount(0);
      }
    }

    const storedName = localStorage.getItem("userDisplayName");

    if (storedName) {
      setUserDisplayName(storedName);
    }

    void loadInvoiceCount();
  }, []);

  return (
    <div
      className={`w-[240px] flex flex-col h-full overflow-hidden flex-shrink-0 border-r transition-colors duration-200
      ${dark
        ? "bg-[#180803] border-[rgba(255,255,255,0.05)]"
        : "bg-[rgba(255,250,245,0.78)] border-[rgba(255,255,255,0.5)] backdrop-blur-xl"}`}
    >

      {/* LOGO */}
      <div className="flex items-center gap-2.5 px-5 h-[72px] flex-shrink-0">
        <div
          className={`w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-[0_10px_20px_rgba(255,83,0,0.28)]
          ${dark ? "bg-[#ff5300]" : "bg-[#ff5300]"}`}
        >
          <Zap size={16} className="text-white" fill="currentColor" />
        </div>

        <div className="leading-tight">
          <span className={`block text-[15px] font-semibold tracking-tight ${t.primary}`}>
            FreelancerOS
          </span>
          <span className={`block text-[10px] ${t.muted}`}>
            Team’s workspace
          </span>
        </div>
      </div>

      {/* MAIN NAV */}
      <div className="px-3 pt-2 flex-1">
        <p className={`${ds.font["2xs"]} uppercase tracking-widest px-2 mb-2 ${t.muted}`}>
          Main
        </p>

        {navMain.map((item) => {
          const badge =
            item.label === "Invoices" && invoiceCount > 0
              ? String(invoiceCount)
              : undefined;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 px-3 py-[9px] rounded-[12px] text-[13px] mb-[6px] transition-all duration-150
                ${isActive
                  ? dark
                    ? "bg-[rgba(255,83,0,0.14)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "bg-[rgba(255,83,0,0.1)] text-[#1f1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                  : dark
                    ? "text-[#b39c8c] hover:text-[#fff1e6] hover:bg-[rgba(255,255,255,0.03)]"
                    : "text-[#7b6252] hover:text-[#3a2315] hover:bg-[rgba(255,255,255,0.55)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-full bg-[#ff5300]" />
                  )}

                  <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="font-medium">{item.label}</span>

                  {badge && (
                    <span
                      className={`ml-auto text-[10px] px-1.5 py-[1px] rounded-[4px] font-medium
                      ${item.alert
                        ? dark
                          ? "bg-[rgba(240,82,82,0.15)] text-[#F05252]"
                          : "bg-[rgba(240,82,82,0.1)] text-[#dc2626]"
                        : dark
                          ? "bg-[rgba(255,255,255,0.08)] text-[#71717a]"
                          : "bg-[rgba(0,0,0,0.06)] text-[#71717a]"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* SECONDARY NAV */}
        <p className={`${ds.font["2xs"]} uppercase tracking-widest px-2 mb-2 mt-6 ${t.muted}`}>
          Reports
        </p>

        {navSecondary.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `group relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-[8px] text-[13px] mb-[2px] transition-all duration-150
              ${isActive
                ? dark
                  ? "bg-[rgba(208,138,103,0.16)] text-white"
                  : "bg-[rgba(0,0,0,0.06)] text-[#09090b]"
                : dark
                  ? "text-[#8a8a95] hover:text-[#d3d3dc] hover:bg-[rgba(255,255,255,0.04)]"
                  : "text-[#71717a] hover:text-[#52525b] hover:bg-[rgba(0,0,0,0.03)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-full bg-[#d08a67]" />
                )}

                <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* BOTTOM */}
      <div
        className={`px-3 pb-4 pt-3 border-t transition-colors
        ${dark
          ? "border-[rgba(255,255,255,0.06)]"
          : "border-[rgba(0,0,0,0.06)]"}`}
      >

        {/* Upgrade nudge */}
        <div
          className={`rounded-[16px] p-3 mb-3 border
          ${dark
            ? "bg-[linear-gradient(180deg,rgba(255,83,0,0.12),rgba(72,28,9,0.16))] border-[rgba(255,83,0,0.2)]"
            : "bg-[linear-gradient(180deg,rgba(255,83,0,0.1),rgba(255,83,0,0.04))] border-[rgba(255,83,0,0.18)]"}`}
        >
          <p className="text-[12px] font-medium text-[#ff5300] mb-0.5">
            Upgrade to Pro
          </p>
          <p className={`text-[12px] ${t.muted}`}>
            Unlock analytics & AI features
          </p>
        </div>

        {/* USER INFO */}
        <div className="flex items-center gap-2.5 px-1 py-2">
          <div className="w-7 h-7 rounded-full bg-[rgba(255,83,0,0.18)] flex items-center justify-center text-[11px] font-semibold text-[#ff5300] flex-shrink-0">
            {userDisplayName.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex flex-col min-w-0">
            <span className={`text-[12px] font-medium truncate ${t.primary}`}>
              {userDisplayName}
            </span>
            <span className={`text-[11px] ${t.muted}`}>
              Free plan
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className={`w-full mt-1 flex items-center gap-2.5 px-3 py-[9px] rounded-[12px] text-[13px] transition-all
          ${dark
            ? "text-[#b39c8c] hover:text-[#F05252] hover:bg-[rgba(240,82,82,0.08)]"
            : "text-[#7b6252] hover:text-[#dc2626] hover:bg-[rgba(240,82,82,0.06)]"}`}
        >
          <LogOut size={14} />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </div>
  );
}
