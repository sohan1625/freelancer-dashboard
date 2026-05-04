import React from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import { tk } from "@/lib/ds";

interface Props {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
}

export function DashboardLayout({ title, subtitle, children, headerActions }: Props) {
    const { theme, toggle } = useTheme();
    const dark = theme === "dark";
    const t = tk(dark);

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-200
            ${dark ? "bg-[#17110d] text-white" : "bg-[#f3ede6] text-[#1f1208]"}`}>

            <AppSidebar theme={theme}/>

            <div className="flex-1 flex flex-col overflow-hidden">

                {/* HEADER */}
                <header className={`h-[72px] flex-shrink-0 flex items-center justify-between px-6 border-b transition-colors
                ${dark ? "border-[rgba(255,255,255,0.05)] bg-[#1a1310]" : "border-[rgba(255,255,255,0.55)] bg-[rgba(250,245,238,0.82)] backdrop-blur-xl"}`}>
                    <div>
                        <h1 className={`text-[15px] font-semibold tracking-tight ${t.primary}`}>{title}</h1>
                        {subtitle && <p className={`text-[12px] mt-0.5 ${t.muted}`}>{subtitle}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* THEME TOGGLE */}
                        <button
                            onClick={toggle}
                            className={`w-[38px] h-[22px] rounded-full relative flex items-center px-[3px] transition-colors duration-300
                ${dark ? "bg-[rgba(255,255,255,0.1)]" : "bg-[rgba(0,0,0,0.12)]"}`}
                            aria-label="Toggle theme">
                            <div className={`w-[16px] h-[16px] rounded-full flex items-center justify-center transition-transform duration-300
                ${dark ? "translate-x-0 bg-white" : "translate-x-[16px] bg-white"}`}>
                                {dark
                                    ? <Moon size={9} className="text-black"/>
                                    : <Sun size={9} className="text-black"/>}
                            </div>
                        </button>

                        {headerActions}
                    </div>
                </header>

                {/* CONTENT */}
                <main className={`flex-1 overflow-auto transition-colors duration-200
                ${dark ? "bg-[#17110d]" : "bg-[#f3ede6]"}`}>
                    <div className="p-6 h-full">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}