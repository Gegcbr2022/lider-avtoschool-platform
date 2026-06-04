// ─── Theme system: dark / light / auto ───────────────────────────────────────
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Appearance, useColorScheme } from "react-native";

export type ThemePreference = "dark" | "light" | "auto";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "@lider:theme_preference";

// ─── Color tokens ─────────────────────────────────────────────────────────────

export const darkColors = {
  // Brand
  red:        "#ff1e1e",
  redDark:    "#cc0000",
  redSoft:    "rgba(255,30,30,0.12)",
  redGlow:    "rgba(255,30,30,0.25)",
  // Backgrounds
  bg:         "#0d0d0d",
  bgCard:     "#1a1a1a",
  bgElevated: "#242424",
  bgSheet:    "#181818",
  // Text
  textPrimary:   "#ffffff",
  textSecondary: "#a0a0a0",
  textTertiary:  "#606060",
  textInverse:   "#0d0d0d",
  // UI
  border:     "#2a2a2a",
  divider:    "#1f1f1f",
  icon:       "#707070",
  iconActive: "#ff1e1e",
  // Semantic
  success:     "#22c55e",
  successSoft: "rgba(34,197,94,0.12)",
  warning:     "#f59e0b",
  warningSoft: "rgba(245,158,11,0.12)",
  info:        "#3b82f6",
  infoSoft:    "rgba(59,130,246,0.12)",
  // Compat aliases
  white:      "#ffffff",
  black:      "#000000",
  muted:      "#606060",
  line:       "#2a2a2a",
  green:      "#22c55e",
  yellow:     "#f59e0b",
  graphite:   "#1a1a1a",
  background: "#0d0d0d",
} as const;

export const lightColors = {
  // Brand
  red:        "#e8000e",
  redDark:    "#b50009",
  redSoft:    "rgba(232,0,14,0.07)",
  redGlow:    "rgba(232,0,14,0.18)",
  // Backgrounds — clean white, subtle hierarchy
  bg:         "#f5f5f7",
  bgCard:     "#ffffff",
  bgElevated: "#ededf0",
  bgSheet:    "#ffffff",
  // Text — deep charcoal not pure black (premium feel)
  textPrimary:   "#1a1a1f",
  textSecondary: "#4a4a5a",
  textTertiary:  "#8a8a9a",
  textInverse:   "#ffffff",
  // UI — soft borders
  border:     "#dcdde5",
  divider:    "#e8e9f0",
  icon:       "#7a7a8a",
  iconActive: "#e8000e",
  // Semantic
  success:     "#15803d",
  successSoft: "rgba(21,128,61,0.09)",
  warning:     "#c2620a",
  warningSoft: "rgba(194,98,10,0.09)",
  info:        "#1d4ed8",
  infoSoft:    "rgba(29,78,216,0.08)",
  // Compat aliases
  white:      "#ffffff",
  black:      "#000000",
  muted:      "#8a8a9a",
  line:       "#dcdde5",
  green:      "#15803d",
  yellow:     "#c2620a",
  graphite:   "#2a2a3a",
  background: "#f5f5f7",
} as const;

export type ThemeColors = typeof darkColors;

// ─── Context ──────────────────────────────────────────────────────────────────

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  setPreference: (pref: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  preference: "dark",
  resolvedTheme: "dark",
  colors: darkColors,
  setPreference: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() ?? "dark";
  const [preference, setPreferenceState] = useState<ThemePreference>("dark");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "dark" || stored === "light" || stored === "auto") {
        setPreferenceState(stored);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
  }, []);

  const resolvedTheme: ResolvedTheme =
    preference === "auto" ? (systemScheme as ResolvedTheme) : preference;

  const colors = resolvedTheme === "light" ? lightColors : darkColors;

  // Don't block render - show dark theme while loading preference from storage
  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, colors, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme() {
  return useContext(ThemeContext);
}

// NOTE: Import darkColors directly — don't use 'colors' alias to avoid Hermes barrel issues
