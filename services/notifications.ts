import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { firebaseConfig } from "../firebase/config";
import { getAppSettings } from "./appSettings";
import { getValidSession } from "./authService";

const VAPID_PUBLIC_KEY = "BAbabRr4zuSW_0C-WA7vJtGXUFsafj4tgTmrbGiWlSFQQzsyg1Ec7BAkJxxWd14JF0hx60vfULSbq6UZ-rdVY8M";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });

export async function requestNotificationPermission() {
  if (Platform.OS !== "web") {
    let status = (await Notifications.getPermissionsAsync()).status;
    if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
    return status === "granted";
  }
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (window.Notification.permission === "granted") return true;
  if (window.Notification.permission === "denied") return false;
  return (await window.Notification.requestPermission()) === "granted";
}

async function saveExpoPushToken(token: string) {
  const session = await getValidSession();
  if (!session || (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken["))) return;
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${encodeURIComponent(session.localId)}?updateMask.fieldPaths=email&updateMask.fieldPaths=expoPushToken&updateMask.fieldPaths=platform&updateMask.fieldPaths=pushUpdatedAt`;
  await fetch(url, { method: "PATCH", headers: { Authorization: `Bearer ${session.idToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields: { email: { stringValue: session.email }, expoPushToken: { stringValue: token }, platform: { stringValue: Platform.OS }, pushUpdatedAt: { stringValue: new Date().toISOString() } } }) });
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function subscriptionId(endpoint: string) {
  let hash = 0;
  for (let index = 0; index < endpoint.length; index += 1) hash = ((hash << 5) - hash + endpoint.charCodeAt(index)) | 0;
  return `sub-${Math.abs(hash)}`;
}

async function registerWebPushSubscription() {
  if (Platform.OS !== "web" || typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  if (!(await requestNotificationPermission())) return null;
  const session = await getValidSession();
  if (!session) return null;
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
  const json = subscription.toJSON();
  const id = subscriptionId(subscription.endpoint);
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${encodeURIComponent(session.localId)}/webPushSubscriptions/${id}`;
  const response = await fetch(url, { method: "PATCH", headers: { Authorization: `Bearer ${session.idToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields: { endpoint: { stringValue: subscription.endpoint }, p256dh: { stringValue: json.keys?.p256dh ?? "" }, auth: { stringValue: json.keys?.auth ?? "" }, userAgent: { stringValue: navigator.userAgent }, updatedAt: { stringValue: new Date().toISOString() } } }) });
  if (!response.ok) throw new Error("Enregistrement Web Push impossible.");
  return id;
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") return registerWebPushSubscription();
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("matches", { name: "Matchs et scrims", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 150, 250], lightColor: "#D4AF37", sound: "default" });
  if (!(await requestNotificationPermission())) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return "local-notifications-enabled";
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await saveExpoPushToken(token).catch(() => null);
    return token;
  } catch {
    return "local-notifications-enabled";
  }
}

export async function notifyMatchCreated({ type, opponent, date, arrivalTime, matchTime, arena }: { type: string; opponent: string; date: string; arrivalTime: string; matchTime: string; arena: string }) {
  if (!(await getAppSettings()).notificationsEnabled) return null;
  const title = `🟡 Nouveau ${type.toLowerCase()} DYNO`;
  const body = `VS ${opponent} • ${formatDate(date)} • RDV ${arrivalTime} • Match ${matchTime} • ${arena}`;
  if (Platform.OS === "web") {
    await registerWebPushSubscription().catch(() => null);
    if (!(await requestNotificationPermission())) return null;
    new window.Notification(title, { body, icon: "/Eva-Esport-Arena/pwa-192.png", badge: "/Eva-Esport-Arena/pwa-192.png", tag: `dyno-match-${date}-${matchTime}-${opponent}` });
    return "web-notification-sent";
  }
  if (!(await requestNotificationPermission())) return null;
  return Notifications.scheduleNotificationAsync({ content: { title, body, sound: "default", data: { type: "match-created", opponent } }, trigger: null });
}

export async function scheduleMatchNotification({ opponent, matchDate }: { opponent: string; matchDate: Date }) {
  if (Platform.OS === "web") return [];
  const settings = await getAppSettings();
  if (!settings.notificationsEnabled || !(await requestNotificationPermission())) return [];
  const ids: string[] = [];
  for (const reminder of [
    { enabled: settings.reminder24h, offset: 86400000, title: "⚔️ Match DYNO demain", body: `Le match contre ${opponent} commence dans 24 heures.` },
    { enabled: settings.reminder1h, offset: 3600000, title: "⚔️ Match DYNO dans 1 heure", body: `Prépare-toi pour le match contre ${opponent}.` },
  ]) {
    const date = new Date(matchDate.getTime() - reminder.offset);
    if (!reminder.enabled || date.getTime() <= Date.now()) continue;
    ids.push(await Notifications.scheduleNotificationAsync({ content: { title: reminder.title, body: reminder.body, sound: "default", data: { type: "match-reminder", opponent } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: "matches" } }));
  }
  return ids;
}

function formatDate(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }); }
