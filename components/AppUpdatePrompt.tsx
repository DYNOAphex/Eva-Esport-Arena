import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { Alert, Platform } from "react-native";

const LATEST_RELEASE_API = "https://api.github.com/repos/DYNOAphex/Eva-Esport-Arena/releases/latest";

type GithubRelease = {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  assets?: Array<{
    name?: string;
    browser_download_url?: string;
  }>;
};

function normalizeVersion(value?: string | null) {
  return (value ?? "0.0.0")
    .trim()
    .replace(/^v/i, "")
    .split("-")[0]
    .split("+")[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

function isNewerVersion(latest?: string, current?: string | null) {
  const latestParts = normalizeVersion(latest);
  const currentParts = normalizeVersion(current);
  const length = Math.max(latestParts.length, currentParts.length, 3);

  for (let index = 0; index < length; index += 1) {
    const latestPart = latestParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
}

function findDownloadUrl(release: GithubRelease) {
  const apk = release.assets?.find((asset) => asset.name?.toLowerCase().endsWith(".apk"));
  return apk?.browser_download_url ?? release.html_url;
}

export default function AppUpdatePrompt() {
  useEffect(() => {
    if (Platform.OS === "web" || __DEV__) return;

    let cancelled = false;

    const checkLatestRelease = async () => {
      try {
        const response = await fetch(LATEST_RELEASE_API, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!response.ok || cancelled) return;

        const release = await response.json() as GithubRelease;
        const currentVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion;
        if (!isNewerVersion(release.tag_name, currentVersion) || cancelled) return;

        const downloadUrl = findDownloadUrl(release);
        const releaseName = release.name || release.tag_name || "Nouvelle version";

        Alert.alert(
          "Mise à jour DYNO disponible",
          `${releaseName} est disponible. Installe-la pour profiter des dernières corrections et améliorations.`,
          [
            { text: "Plus tard", style: "cancel" },
            {
              text: "Mettre à jour",
              onPress: () => {
                if (downloadUrl) void Linking.openURL(downloadUrl);
              },
            },
          ],
        );
      } catch {
        // L'application reste utilisable si GitHub est momentanément indisponible.
      }
    };

    const timer = setTimeout(() => void checkLatestRelease(), 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
