/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      colors: {
        /* CORE TOKENS (linked to CSS variables) */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",

        /* EXTRA DESIGN COLORS */
        surface: "#111111",
        surfaceLight: "#161616",

        borderStrong: "rgba(255,255,255,0.12)",

        text: {
          primary: "#ffffff",
          secondary: "#a1a1aa",
          muted: "#71717a",
        },


        theme: {
          extend: {
            fontFamily: {
              sans: ["Geist", "system-ui", "sans-serif"],
            },
          },
        },

        accent: {
          green: "#22c55e",
          yellow: "#f59e0b",
          red: "#ef4444",
        },
      },

      boxShadow: {
        card: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 20px rgba(0,0,0,0.6)",
      },

      borderRadius: {
        xl: "14px",
      },

      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },

    },
  },
  plugins: [],
};