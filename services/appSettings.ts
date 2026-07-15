import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppearanceMode = "gold" | "dark";
export type AppSettings = {
  notificationsEnabled: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  appearance: AppearanceMode;
};

const SETTINGS_KEY = "dyno.app.settings.v1";
const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  reminder24h: true,
  reminder1h: true,
  appearance: "gold",
};

export async function getAppSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const value = JSON.parse(raw) as Partial<AppSettings>;
    return {
      notificationsEnabled: value.notificationsEnabled !== false,
      reminder24h: value.reminder24h !== false,
      reminder1h: value.reminder1h !== false,
      appearance: value.appearance === "dark" ? "dark" : "gold",
    };
  } catch { return DEFAULT_SETTINGS; }
}

export async function updateAppSettings(patch: Partial<AppSettings>) {
  const current = await getAppSettings();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}