import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#080C14",
          surface: "#0F172A",
          elevated: "#1E293B",
        },
        brand: {
          cyan: "#06B6D4",
          indigo: "#6366F1",
          blue: "#3B82F6",
        },
        severity: {
          critical: "#EF4444",
          high: "#F97316",
          medium: "#F59E0B",
          low: "#3B82F6",
          info: "#64748B",
        },
        border: {
          subtle: "#1E293B",
          hover: "#334155",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["Fira Code", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
