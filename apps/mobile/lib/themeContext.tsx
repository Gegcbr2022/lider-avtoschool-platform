import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Appearance, useColorScheme } from "react-native";

export type ThemePreference = "dark" | "light" | "auto";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "@lider:theme_preference";

// $10K Aesthetic: OLED Black, absolute contrast, zero muddy grays.
export const darkColors = {
  // Brand (Red) - Deep, visceral red. Not a default CSS red.
  red:        "#E51D1D",
  redDark:    "#990F0F",
  redSoft:    "rgba(229, 29, 29, 0.1)",
  redGlow:    "rgba(229, 29, 29, 0.2)",
  // Brand (Green) - For success states, desaturated.
  green:      "#004033",
  // Backgrounds - Pure OLED black for depth. 
  bg:         "#000000",
  bgCard:     "#0A0A0A",
  bgElevated: "#121212",
  bgSheet:    "#0F0F0F",
  // Text - Not pure white to prevent halation.
  textPrimary:   "#F5F5F5",
  textSecondary: "#8A8A8A",
  textTertiary:  "#525252",
  textInverse:   "#000000",
  // UI - Hairline borders, no heavy shadows.
  border:     "rgba(255,255,255,0.08)",
  divider:    "rgba(255,255,255,0.04)",
  icon:       "#525252",
  iconActive: "#E51D1D",
  // Semantic
  success:     "#22c55e",
  successSoft: "rgba(34,197,94,0.1)",
  warning:     "#f59e0b",
  warningSoft: "rgba(245,158,11,0.1)",
  info:        "#3b82f6",
  infoSoft:    "rgba(59,130,246,0.1)",
  // Compat aliases
  white:      "#FFFFFF",
  black:      "#000000",
  muted:      "#8A8A8A",
  line:       "rgba(255,255,255,0.08)",
  yellow:     "#ffd600",
  graphite:   "#0A0A0A",
  background: "#000000",
} as const;

// Light theme: Off-white, stark architectural contrast.
export const lightColors = {
  red:        "#DF1616",
  redDark:    "#A60F0F",
  redSoft:    "rgba(223, 22, 22, 0.06)",
  redGlow:    "rgba(223, 22, 22, 0.15)",
  green:      "#004d40",
  bg:         "#F7F7F7",
  bgCard:     "#FFFFFF",
  bgElevated: "#F2F2F2",
  bgSheet:    "#FFFFFF",
  textPrimary:   "#0A0A0A",
  textSecondary: "#666666",
  textTertiary:  "#A3A3A3",
  textInverse:   "#FFFFFF",
  border:     "rgba(0,0,0,0.06)",
  divider:    "rgba(0,0,0,0.03)",
  icon:       "#A3A3A3",
  iconActive: "#DF1616",
  success:     "#15803d",
  successSoft: "rgba(21,128,61,0.08)",
  warning:     "#d97706",
  warningSoft: "rgba(217,119,6,0.08)",
  info:        "#1d4ed8",
  infoSoft:    "rgba(29,78,216,0.08)",
  white:      "#FFFFFF",
  black:      "#000000",
  muted:      "#666666",
  line:       "rgba(0,0,0,0.06)",
  yellow:     "#d97706",
  graphite:   "#0A0A0A",
  background: "#F7F7F7",
} as const;

export type ThemeColors = typeof darkColors | typeof lightColors;

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

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, colors, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
