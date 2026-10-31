/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
      },

      colors: {
        stellar: {
          dark:    "#020817",
          surface: "#0a0f1e",
          card:    "#0f1729",
          border:  "#1e2d45",
          accent:  "#6366f1",
          violet:  "#8b5cf6",
          cyan:    "#06b6d4",
          danger:  "#ef4444",
          safe:    "#22c55e",
          warning: "#f59e0b",
        },
        neon: {
          indigo: "#818cf8",
          violet: "#a78bfa",
          cyan:   "#22d3ee",
          green:  "#34d399",
          red:    "#f87171",
        },
        // Extended indigo/violet shades
        indigo: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        violet: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        cyan: {
          50:  "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
          950: "#083344",
        },
      },

      backgroundImage: {
        "gradient-cyber":          "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
        "gradient-indigo-violet":  "linear-gradient(135deg, #6366f1, #8b5cf6)",
        "gradient-violet-cyan":    "linear-gradient(135deg, #8b5cf6, #06b6d4)",
        "gradient-hero":           "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 60%)",
        "gradient-card":           "linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(10,15,30,0.85) 100%)",
        "gradient-neon-border":    "linear-gradient(135deg, rgba(99,102,241,0.6), rgba(139,92,246,0.4), rgba(6,182,212,0.5))",
        "gradient-scanline":       "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.03) 50%)",
      },

      boxShadow: {
        "glow-indigo":    "0 0 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, 0.2)",
        "glow-indigo-sm": "0 0 8px rgba(99, 102, 241, 0.5), 0 0 16px rgba(99, 102, 241, 0.25)",
        "glow-indigo-lg": "0 0 30px rgba(99, 102, 241, 0.5), 0 0 60px rgba(99, 102, 241, 0.3), 0 0 90px rgba(99, 102, 241, 0.15)",
        "glow-violet":    "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)",
        "glow-violet-sm": "0 0 8px rgba(139, 92, 246, 0.5), 0 0 16px rgba(139, 92, 246, 0.25)",
        "glow-cyan":      "0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2)",
        "glow-cyan-sm":   "0 0 8px rgba(6, 182, 212, 0.5), 0 0 16px rgba(6, 182, 212, 0.25)",
        "glow-green":     "0 0 12px rgba(34, 197, 94, 0.5), 0 0 24px rgba(34, 197, 94, 0.25)",
        "glow-red":       "0 0 12px rgba(239, 68, 68, 0.5), 0 0 24px rgba(239, 68, 68, 0.25)",
        "card-dark":      "0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        "header":         "0 4px 32px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(99, 102, 241, 0.1)",
      },

      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(99, 102, 241, 0.3), 0 0 20px rgba(99, 102, 241, 0.15)" },
          "50%":      { boxShadow: "0 0 20px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99, 102, 241, 0.3)" },
        },
        "cyan-glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(6, 182, 212, 0.3), 0 0 20px rgba(6, 182, 212, 0.15)" },
          "50%":      { boxShadow: "0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)" },
        },
        "violet-glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.15)" },
          "50%":      { boxShadow: "0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        "float-up": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-4px)" },
        },
        "nebula-shift": {
          "0%":   { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "100% 100%" },
        },
        "status-blink": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 6px rgba(34, 197, 94, 0.8)" },
          "50%":      { opacity: "0.6", boxShadow: "0 0 12px rgba(34, 197, 94, 1)" },
        },
        "neon-border-spin": {
          "0%":   { borderColor: "rgba(99, 102, 241, 0.6)" },
          "33%":  { borderColor: "rgba(139, 92, 246, 0.6)" },
          "66%":  { borderColor: "rgba(6, 182, 212, 0.6)" },
          "100%": { borderColor: "rgba(99, 102, 241, 0.6)" },
        },
        "counter-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to:   { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(20px)", opacity: "0" },
          to:   { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to:   { transform: "scale(1)", opacity: "1" },
        },
      },

      animation: {
        "glow-pulse":         "glow-pulse 2.5s ease-in-out infinite",
        "cyan-glow-pulse":    "cyan-glow-pulse 2.5s ease-in-out infinite",
        "violet-glow-pulse":  "violet-glow-pulse 2.5s ease-in-out infinite",
        "shimmer":            "shimmer 2s linear infinite",
        "gradient-x":         "gradient-x 5s ease infinite",
        "float-up":           "float-up 3s ease-in-out infinite",
        "nebula-shift":       "nebula-shift 20s ease-in-out infinite alternate",
        "status-blink":       "status-blink 2s ease-in-out infinite",
        "neon-border-spin":   "neon-border-spin 4s linear infinite",
        "counter-up":         "counter-up 0.5s ease-out forwards",
        "slide-in-right":     "slide-in-right 0.3s ease-out forwards",
        "fade-in":            "fade-in 0.4s ease-out forwards",
        "scale-in":           "scale-in 0.3s ease-out forwards",
      },

      backdropBlur: {
        xs: "2px",
      },

      borderColor: {
        "stellar-glow": "rgba(99, 102, 241, 0.3)",
      },
    },
  },
  plugins: [],
};
