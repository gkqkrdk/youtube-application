import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        panel: "#16181f",
        panelSoft: "#20232c",
        ink: "#f5f7fb",
        muted: "#9aa4b2",
        line: "#303442",
        growth: "#2dd4bf",
        cash: "#22c55e",
        consensus: "#a78bfa",
        chart: "#60a5fa",
        risk: "#ef4444"
      }
    }
  },
  plugins: []
};

export default config;
