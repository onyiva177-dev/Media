import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        ink: "#0A0A0A",
        canvas: "#F5F0E8",
        amber: {
          glow: "#F59E0B",
          dim: "#92400E",
        },
        surface: {
          DEFAULT: "#141414",
          raised: "#1C1C1C",
          hover: "#242424",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease forwards",
        "scale-in": "scaleIn 0.2s ease forwards",
        "pulse-amber": "pulseAmber 1.5s ease infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseAmber: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245,158,11,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(245,158,11,0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
