import { useEffect, useState } from "react";

export function useTheme() {
    const [theme, setTheme] = useState<"dark" | "light">(() => {
        return (localStorage.getItem("theme") as "dark" | "light") || "light";
    });

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    return { theme, toggle };
}