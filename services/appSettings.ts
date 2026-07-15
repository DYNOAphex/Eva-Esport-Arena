import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppearanceMode = "gold" | "dark";
export type AppSettings = {
  notificationsEnabled: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  appearance: AppearanceMode;
  confirmationThreshold: number;
};

const SETTINGS_KEY = "dyno.app.settings.v1";
const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  reminder24h: true,
  reminder1h: true,
  appearance: "gold",
  confirmationThreshold: 4,
};

export async function getAppSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const value = JSON.parse(raw) as Partial<AppSettings>;
    const threshold = Number(value.confirmationThreshold);
    return {
      notificationsEnabled: value.notificationsEnabled !== false,
      reminder24h: value.reminder24h !== false,
      reminder1h: value.reminder1h !== false,
      appearance: value.appearance === "dark" ? "dark" : "gold",
      confirmationThreshold: Number.isInteger(threshold) && threshold >= 1 && threshold <= 12 ? threshold : 4,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateAppSettings(patch: Partial<AppSettings>) {
  const current = await getAppSettings();
  const next = { ...current, ...patch };
  next.confirmationThreshold = Math.min(12, Math.max(1, Math.round(next.confirmationThreshold)));
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}
