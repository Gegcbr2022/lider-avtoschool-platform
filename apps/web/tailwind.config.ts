import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        lider: {
          green: "#004d40",
          yellow: "#ffd600",
          graphite: "#171b1a",
          muted: "#5f6f6a",
          line: "#dce7e3",
          background: "#f7fbf9"
        }
      },
      boxShadow: {
        soft: "0 24px 70px rgba(0, 77, 64, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
