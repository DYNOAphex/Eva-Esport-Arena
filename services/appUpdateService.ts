import Constants from "expo-constants";
import { Linking, Platform } from "react-native";

const LATEST_RELEASE_URL = "https://api.github.com/repos/DYNOAphex/Eva-Esport-Arena/releases/latest";

export type AppUpdateInfo = {
  installedVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  downloadUrl?: string;
  releaseUrl?: string;
  publishedAt?: string;
  releaseNotes: string[];
};

type GitHubRelease = {
  tag_name?: string;
  html_url?: string;
  published_at?: string;
  body?: string;
  assets?: Array<{ name?: string; browser_download_url?: string }>;
};

export function getInstalledVersion() {
  return Constants.expoConfig?.version ?? "0.0.0";
}

export async function checkForAppUpdate(): Promise<AppUpdateInfo> {
  const installedVersion = getInstalledVersion();
  const response = await fetch(LATEST_RELEASE_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (response.status === 404) {
    return { installedVersion, latestVersion: installedVersion, updateAvailable: false, releaseNotes: [] };
  }
  if (!response.ok) throw new Error("Impossible de vérifier les mises à jour GitHub.");

  const release = (await response.json()) as GitHubRelease;
  const latestVersion = normalizeVersion(release.tag_name ?? installedVersion);
  const apk = release.assets?.find((asset) => asset.name?.toLowerCase().endsWith(".apk"));

  return {
    installedVersion,
    latestVersion,
    updateAvailable: Platform.OS === "android" && compareVersions(latestVersion, installedVersion) > 0,
    downloadUrl: apk?.browser_download_url,
    releaseUrl: release.html_url,
    publishedAt: release.published_at,
    releaseNotes: parseReleaseNotes(release.body),
  };
}

export async function openAppUpdate(info: AppUpdateInfo) {
  const url = info.downloadUrl ?? info.releaseUrl;
  if (!url) throw new Error("Aucun fichier APK n'est disponible dans la dernière Release GitHub.");
  await Linking.openURL(url);
}

function parseReleaseNotes(body?: string) {
  if (!body) return [];
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1"))
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/i, "").split("-")[0] || "0.0.0";
}

function compareVersions(left: string, right: string) {
  const a = normalizeVersion(left).split(".").map((part) => Number(part) || 0);
  const b = normalizeVersion(right).split(".").map((part) => Number(part) || 0);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
