import { useEffect, useState } from "react";

export function useTheme() {
    const [theme, setTheme] = useState<"dark" | "light">(() => {
        const saved = localStorage.getItem("theme");
        if (saved === "dark" || saved === "light") {
            return saved;
        }
        return document.documentElement.classList.contains("dark") ? "dark" : "dark";
    });

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    return { theme, toggle };
}