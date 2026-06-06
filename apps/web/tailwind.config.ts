import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lider: {
          red: "#ff1e1e",
          redDark: "#d81414",
          green: "#004d40",
          greenDark: "#003329",
          yellow: "#ffd600",
          graphite: "#111111",
          muted: "#666666",
          line: "#e5e5e5",
          background: "#f5f5f5"
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
