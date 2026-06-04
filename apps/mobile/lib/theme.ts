// ─── Lider Design System ──────────────────────────────────────────────────────
// USAGE:
//   Static dark colors: import { darkColors } from "../../lib/theme";
//   Dynamic colors:     const { colors } = useTheme();
//   Provider:           import { ThemeProvider } from "../../lib/theme";

export { darkColors, lightColors, useTheme, ThemeProvider } from "./themeContext";
export type { ThemeColors, ThemePreference, ResolvedTheme } from "./themeContext";


export const radii = {
  xs:  8,
  sm:  14,
  md:  20,
  lg:  28,
  xl:  36,
  full: 999,
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  red: {
    shadowColor: "#ff1e1e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
