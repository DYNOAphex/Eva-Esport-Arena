import { Platform } from "react-native";

import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";
import { registerForPushNotificationsAsync, requestNotificationPermission } from "./notifications";

const LAST_TEST_KEY = "dyno_web_push_last_test";

export type WebPushState = "ready" | "missing" | "error" | "unsupported";

export type WebPushDiagnostic = {
  supported: boolean;
  permission: "granted" | "denied" | "default" | "unsupported";
  serviceWorker: WebPushState;
  subscription: WebPushState;
  firebase: WebPushState;
  installed: boolean;
  isIOS: boolean;
  lastTest?: { status: "received" | "failed"; at: string; message?: string };
  error?: string;
};

function subscriptionId(endpoint: string) {
  let hash = 0;
  for (let index = 0; index < endpoint.length; index += 1) {
    hash = ((hash << 5) - hash + endpoint.charCodeAt(index)) | 0;
  }
  return `sub-${Math.abs(hash)}`;
}

function subscriptionUrl(uid: string, id: string) {
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${encodeURIComponent(uid)}/webPushSubscriptions/${id}`;
}

function isInstalledPwa() {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const navigatorStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return Boolean(standalone || navigatorStandalone);
}

function readLastTest(): WebPushDiagnostic["lastTest"] {
  if (typeof window === "undefined") return undefined;
  try {
    const value = window.localStorage.getItem(LAST_TEST_KEY);
    return value ? JSON.parse(value) : undefined;
  } catch {
    return undefined;
  }
}

function saveLastTest(value: NonNullable<WebPushDiagnostic["lastTest"]>) {
  if (typeof window !== "undefined") window.localStorage.setItem(LAST_TEST_KEY, JSON.stringify(value));
}

export async function getWebPushDiagnostic(): Promise<WebPushDiagnostic> {
  const base: WebPushDiagnostic = {
    supported: false,
    permission: "unsupported",
    serviceWorker: "unsupported",
    subscription: "unsupported",
    firebase: "unsupported",
    installed: false,
    isIOS: false,
    lastTest: readLastTest(),
  };

  if (Platform.OS !== "web" || typeof window === "undefined") return base;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  const diagnostic: WebPushDiagnostic = {
    ...base,
    supported,
    permission: "Notification" in window ? window.Notification.permission : "unsupported",
    serviceWorker: supported ? "missing" : "unsupported",
    subscription: supported ? "missing" : "unsupported",
    firebase: supported ? "missing" : "unsupported",
    installed: isInstalledPwa(),
    isIOS,
  };

  if (!supported) return diagnostic;

  try {
    const registration = await navigator.serviceWorker.ready;
    diagnostic.serviceWorker = registration.active ? "ready" : "error";
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return diagnostic;

    diagnostic.subscription = "ready";
    const session = await getValidSession();
    if (!session) {
      diagnostic.firebase = "error";
      diagnostic.error = "Session Firebase absente.";
      return diagnostic;
    }

    const response = await fetch(subscriptionUrl(session.localId, subscriptionId(subscription.endpoint)), {
      headers: { Authorization: `Bearer ${session.idToken}` },
    });
    diagnostic.firebase = response.ok ? "ready" : response.status === 404 ? "missing" : "error";
    if (!response.ok && response.status !== 404) diagnostic.error = `Lecture Firebase impossible (${response.status}).`;
  } catch (error) {
    diagnostic.serviceWorker = "error";
    diagnostic.subscription = "error";
    diagnostic.error = error instanceof Error ? error.message : "Diagnostic Web Push impossible.";
  }

  return diagnostic;
}

export async function repairWebPushSubscription() {
  const result = await registerForPushNotificationsAsync();
  if (!result) throw new Error("Autorisation refusée ou Web Push indisponible sur cet appareil.");
  return getWebPushDiagnostic();
}

export async function sendWebPushLocalTest() {
  if (Platform.OS !== "web" || typeof window === "undefined") throw new Error("Test réservé à l'application web.");
  try {
    if (!(await requestNotificationPermission())) throw new Error("Autorisation de notification refusée.");
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Test DYNO réussi", {
      body: "Le navigateur et le service worker peuvent afficher les notifications.",
      icon: "/Eva-Esport-Arena/pwa-192.png",
      badge: "/Eva-Esport-Arena/pwa-192.png",
      tag: "dyno-web-push-test",
      data: { url: "/Eva-Esport-Arena/" },
    });
    const result = { status: "received" as const, at: new Date().toISOString() };
    saveLastTest(result);
    return result;
  } catch (error) {
    const result = { status: "failed" as const, at: new Date().toISOString(), message: error instanceof Error ? error.message : "Échec du test." };
    saveLastTest(result);
    throw error;
  }
}
