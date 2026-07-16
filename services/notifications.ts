import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getAppSettings } from "./appSettings";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });

async function requestWebNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (window.Notification.permission === "granted") return true;
  if (window.Notification.permission === "denied") return false;
  return (await window.Notification.requestPermission()) === "granted";
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") {
    return (await requestWebNotificationPermission()) ? "web-notifications-enabled" : null;
  }

  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("matches", { name: "Matchs et scrims", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 150, 250], lightColor: "#D4AF37", sound: "default" });
  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return "local-notifications-enabled";

  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return "local-notifications-enabled";
  }
}

export async function notifyMatchCreated({ type, opponent, date, arrivalTime, matchTime, arena }: { type: string; opponent: string; date: string; arrivalTime: string; matchTime: string; arena: string }) {
  if (!(await getAppSettings()).notificationsEnabled) return null;
  const title = `🟡 Nouveau ${type.toLowerCase()} DYNO`;
  const body = `VS ${opponent} • ${formatDate(date)} • RDV ${arrivalTime} • Match ${matchTime} • ${arena}`;

  if (Platform.OS === "web") {
    if (!(await requestWebNotificationPermission())) return null;
    new window.Notification(title, {
      body,
      icon: "/Eva-Esport-Arena/pwa-192.png",
      badge: "/Eva-Esport-Arena/pwa-192.png",
      tag: `dyno-match-${date}-${matchTime}-${opponent}`,
    });
    return "web-notification-sent";
  }

  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;
  return Notifications.scheduleNotificationAsync({ content: { title, body, sound: "default", data: { type: "match-created", opponent } }, trigger: null });
}

export async function scheduleMatchNotification({ opponent, matchDate }: { opponent: string; matchDate: Date }) {
  if (Platform.OS === "web") return [];

  const settings = await getAppSettings();
  if (!settings.notificationsEnabled) return [];
  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return [];
  const ids: string[] = [];
  const reminders = [
    { enabled: settings.reminder24h, offset: 86400000, title: "⚔️ Match DYNO demain", body: `Le match contre ${opponent} commence dans 24 heures.` },
    { enabled: settings.reminder1h, offset: 3600000, title: "⚔️ Match DYNO dans 1 heure", body: `Prépare-toi pour le match contre ${opponent}.` },
  ];
  for (const reminder of reminders) {
    const date = new Date(matchDate.getTime() - reminder.offset);
    if (!reminder.enabled || date.getTime() <= Date.now()) continue;
    ids.push(await Notifications.scheduleNotificationAsync({ content: { title: reminder.title, body: reminder.body, sound: "default", data: { type: "match-reminder", opponent } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: "matches" } }));
  }
  return ids;
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
