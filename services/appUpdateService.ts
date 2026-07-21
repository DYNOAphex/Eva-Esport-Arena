import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

export type AppUpdateInfo = {
  installedVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseNotes: string[];
};

export function getInstalledVersion() {
  return Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? "0.0.0";
}

export async function checkForAppUpdate(): Promise<AppUpdateInfo> {
  const installedVersion = getInstalledVersion();

  if (Platform.OS !== "android" || !Updates.isEnabled) {
    return {
      installedVersion,
      latestVersion: installedVersion,
      updateAvailable: false,
      releaseNotes: [],
    };
  }

  const result = await Updates.checkForUpdateAsync();
  return {
    installedVersion,
    latestVersion: installedVersion,
    updateAvailable: result.isAvailable,
    releaseNotes: result.isAvailable
      ? ["Mise à jour prête à être installée directement dans DYNO."]
      : [],
  };
}

export async function openAppUpdate(info: AppUpdateInfo) {
  if (!info.updateAvailable) return;
  if (Platform.OS !== "android" || !Updates.isEnabled) {
    throw new Error("Les mises à jour directes ne sont pas disponibles sur cette installation.");
  }

  const result = await Updates.fetchUpdateAsync();
  if (!result.isNew) {
    throw new Error("La mise à jour n’a pas pu être récupérée. Réessaie dans quelques instants.");
  }

  await Updates.reloadAsync();
}
