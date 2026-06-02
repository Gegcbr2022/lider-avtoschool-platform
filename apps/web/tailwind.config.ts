import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lider: {
          red: "#ff1e1e",
          redDark: "#d81414",
          green: "#ff1e1e",
          yellow: "#ff1e1e",
          graphite: "#1a1a1a",
          muted: "#666666",
          line: "#e5e5e5",
          background: "#f4f4f4"
        }
      },
      boxShadow: {
        soft: "0 24px 70px rgba(26, 26, 26, 0.12)",
        premium: "0 28px 90px rgba(26, 26, 26, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
