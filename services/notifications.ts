import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getAppSettings } from "./appSettings";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("matches", { name: "Matchs et scrims", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 150, 250], lightColor: "#D4AF37", sound: "default" });
  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export async function notifyMatchCreated({ type, opponent, date, arrivalTime, matchTime, arena }: { type: string; opponent: string; date: string; arrivalTime: string; matchTime: string; arena: string }) {
  if (!(await getAppSettings()).notificationsEnabled) return null;
  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;
  return Notifications.scheduleNotificationAsync({ content: { title: `🟡 Nouveau ${type.toLowerCase()} DYNO`, body: `VS ${opponent} • ${formatDate(date)} • RDV ${arrivalTime} • Match ${matchTime} • ${arena}`, sound: "default", data: { type: "match-created", opponent } }, trigger: null });
}

export async function scheduleMatchNotification({ opponent, matchDate }: { opponent: string; matchDate: Date }) {
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