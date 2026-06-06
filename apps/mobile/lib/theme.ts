export { darkColors, lightColors, useTheme, ThemeProvider } from "./themeContext";
export type { ThemeColors, ThemePreference, ResolvedTheme } from "./themeContext";

// $10K Logic: Huge sweeping curves, or brutalist sharp edges. 
// We commit to a sleek geometric feel.
export const radii = {
  xs:  6,
  sm:  12,
  md:  16,
  lg:  24,
  xl:  32,
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

// $10K Logic: Dark mode shouldn't have muddy shadows. 
// We rely on 1px borders in dark mode, and ultra-soft, wide-spread shadows in light mode.
export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 2,
  },
  red: {
    shadowColor: "#E51D1D",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 6,
  },
} as const;
