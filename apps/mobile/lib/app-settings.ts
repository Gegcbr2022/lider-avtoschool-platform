import AsyncStorage from "@react-native-async-storage/async-storage";

export const APP_SETTINGS_KEY = "lider-app-settings-v1";

export type AppSettings = {
  mascotGuide: boolean;
  visualHints: boolean;
  shareResults: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  mascotGuide: true,
  visualHints: true,
  shareResults: true,
};

export async function loadAppSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(APP_SETTINGS_KEY);
  if (!raw) return DEFAULT_APP_SETTINGS;
  const parsed = JSON.parse(raw) as Partial<AppSettings>;
  return { ...DEFAULT_APP_SETTINGS, ...parsed };
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
}
