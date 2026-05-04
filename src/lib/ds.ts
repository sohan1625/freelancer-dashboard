// ─── FreelancerOS Design System v2 ─────────────────────────────
// Aesthetic: Premium & bold — dark-first, Vercel-inspired
// Font: Geist (loaded via index.html or main.tsx)

export const ds = {
    font: {
        "2xs": "text-[10px]",
        xs:    "text-[11px]",
        sm:    "text-[12px]",
        base:  "text-[13px]",
        md:    "text-[14px]",
        lg:    "text-[16px]",
        xl:    "text-[20px]",
        "2xl": "text-[24px]",
        "3xl": "text-[32px]",
    },
    weight: {
        normal:   "font-normal",
        medium:   "font-medium",
        semibold: "font-semibold",
        bold:     "font-bold",
    },
    radius: {
        sm:  "rounded-[6px]",
        md:  "rounded-[8px]",
        lg:  "rounded-[12px]",
        xl:  "rounded-[16px]",
        full:"rounded-full",
    },
    color: {
        green:       "#5DCAA5",
        greenDim:    "rgba(93,202,165,0.12)",
        greenBorder: "rgba(93,202,165,0.2)",
        blue:        "#378ADD",
        blueDim:     "rgba(55,138,221,0.12)",
        red:         "#F05252",
        redDim:      "rgba(240,82,82,0.12)",
        orange:      "#F59E0B",
        orangeDim:   "rgba(245,158,11,0.12)",
    },
    dark: {
        bg:           "#101012",
        bgElevated:   "#151418",
        sidebar:      "#131317",
        card:         "#1a1a1f",
        cardHover:    "#222228",
        border:       "rgba(255,255,255,0.06)",
        borderStrong: "rgba(255,255,255,0.14)",
        text: {
            primary:   "#ffffff",
            secondary: "#b2b2bc",
            muted:     "#8a8a95",
            dim:       "#5c5c67",
        },
    },
    light: {
        bg:           "#fafafa",
        bgElevated:   "#ffffff",
        sidebar:      "#ffffff",
        card:         "#ffffff",
        cardHover:    "#f9f9f9",
        border:       "rgba(0,0,0,0.08)",
        borderStrong: "rgba(0,0,0,0.15)",
        text: {
            primary:   "#09090b",
            secondary: "#52525b",
            muted:     "#a1a1aa",
            dim:       "#d4d4d8",
        },
    },
} as const;

export function tk(dark: boolean) {
    const t = dark ? ds.dark : ds.light;
    return {
        t,
        // Card class — premium layered look
        card: dark
            ? "bg-[#1a1a1f] border border-[rgba(255,255,255,0.06)] rounded-[12px] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-200"
            : "bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] transition-all duration-200 shadow-sm",
        cardHover: dark
            ? "hover:bg-[#222228] hover:border-[rgba(255,255,255,0.12)]"
            : "hover:shadow-md hover:border-[rgba(0,0,0,0.15)]",

        // Text helpers
        primary:   dark ? "text-white"       : "text-[#09090b]",
        secondary: dark ? "text-[#a1a1aa]"   : "text-[#52525b]",
        muted:     dark ? "text-[#71717a]"   : "text-[#a1a1aa]",
        dim:       dark ? "text-[#3f3f46]"   : "text-[#d4d4d8]",

        // Divider
        divider: dark ? "border-[rgba(255,255,255,0.06)]" : "border-[rgba(0,0,0,0.06)]",

        // Chart
        barEmpty:   dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
        donutTrack: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
        donutText:  dark ? "#a1a1aa" : "#52525b",

        // Input
        input: dark
            ? "bg-[#151418] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[#5c5c67] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[rgba(208,138,103,0.65)] transition-colors"
            : "bg-white border border-[rgba(0,0,0,0.1)] text-[#09090b] placeholder:text-[#a1a1aa] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[rgba(0,0,0,0.3)] transition-colors",

        // Buttons
        btnPrimary: dark
            ? "bg-gradient-to-r from-[#7f4e3f] to-[#d08a67] text-white hover:brightness-105 active:brightness-95"
            : "bg-[#09090b] text-white hover:bg-[#27272a] active:bg-[#3f3f46]",
        btnGhost: dark
            ? "bg-transparent border border-[rgba(255,255,255,0.12)] text-[#b2b2bc] hover:bg-[#222228] hover:text-white hover:border-[rgba(255,255,255,0.18)]"
            : "bg-transparent border border-[rgba(0,0,0,0.1)] text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#09090b]",
        btnDanger: "bg-[rgba(240,82,82,0.1)] border border-[rgba(240,82,82,0.2)] text-[#F05252] hover:bg-[rgba(240,82,82,0.15)]",
    };
}

// Status pill helper
export function pill(status: "paid" | "pending" | "overdue" | "draft", dark: boolean) {
    const map = {
        paid:    { bg: dark ? "rgba(93,202,165,0.1)"  : "#ecfdf5", text: dark ? "#5DCAA5" : "#059669", border: dark ? "rgba(93,202,165,0.2)"  : "rgba(5,150,105,0.2)"  },
        pending: { bg: dark ? "rgba(245,158,11,0.1)"  : "#fffbeb", text: dark ? "#F59E0B" : "#d97706", border: dark ? "rgba(245,158,11,0.2)"  : "rgba(217,119,6,0.2)"  },
        overdue: { bg: dark ? "rgba(240,82,82,0.1)"   : "#fef2f2", text: dark ? "#F05252" : "#dc2626", border: dark ? "rgba(240,82,82,0.2)"   : "rgba(220,38,38,0.2)"  },
        draft:   { bg: dark ? "rgba(255,255,255,0.05)" : "#f4f4f5", text: dark ? "#71717a" : "#71717a", border: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"    },
    };
    return map[status];
}