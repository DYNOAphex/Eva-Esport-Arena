import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";

const LAST_SYNC_KEY = "dyno_last_successful_sync_v1";
const BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

export type SyncDiagnostic = {
  online: boolean;
  authenticated: boolean;
  firebase: boolean;
  matches: number;
  members: number;
  platform: string;
  browser: string;
  lastSync?: string;
  error?: string;
};

function browserLabel() {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return Platform.OS === "android" ? "Application Android" : Platform.OS;
  const agent = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(agent) && /Safari/i.test(agent)) return "Safari iOS";
  if (/Safari/i.test(agent) && !/Chrome|Chromium|Android/i.test(agent)) return "Safari";
  if (/Chrome|Chromium/i.test(agent)) return "Chrome";
  return "Navigateur Web";
}

async function countCollection(collection: string, idToken: string) {
  const response = await fetch(`${BASE}/${collection}?pageSize=100`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${idToken}`, "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error(`Firebase refuse l’accès à ${collection} (${response.status}).`);
  const data = await response.json() as { documents?: unknown[] };
  return data.documents?.length ?? 0;
}

export async function runSyncDiagnostic(): Promise<SyncDiagnostic> {
  const online = Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.onLine : true;
  const platform = Platform.OS;
  const browser = browserLabel();
  const previous = await AsyncStorage.getItem(LAST_SYNC_KEY);

  if (!online) return { online: false, authenticated: false, firebase: false, matches: 0, members: 0, platform, browser, lastSync: previous ?? undefined, error: "Aucune connexion Internet." };

  const session = await getValidSession();
  if (!session) return { online: true, authenticated: false, firebase: false, matches: 0, members: 0, platform, browser, lastSync: previous ?? undefined, error: "La session a expiré. Reconnecte-toi." };

  try {
    const [matches, members] = await Promise.all([
      countCollection("matches", session.idToken),
      countCollection("roster", session.idToken),
    ]);
    const lastSync = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNC_KEY, lastSync);
    return { online: true, authenticated: true, firebase: true, matches, members, platform, browser, lastSync };
  } catch (error) {
    return { online: true, authenticated: true, firebase: false, matches: 0, members: 0, platform, browser, lastSync: previous ?? undefined, error: error instanceof Error ? error.message : "Synchronisation Firebase impossible." };
  }
}
