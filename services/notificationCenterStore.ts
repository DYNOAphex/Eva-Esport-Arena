import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import type { DynoNotificationItem } from "../components/dyno/NotificationCenter";
import type { Match } from "./matchStore";

const READ_IDS_KEY = "dyno_notification_center_read_ids_v1";

async function getReadIds() {
  const raw = await AsyncStorage.getItem(READ_IDS_KEY);
  if (!raw) return new Set<string>();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set<string>();
  }
}

async function saveReadIds(ids: Set<string>) {
  await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids].slice(-250)));
}

function formatDate(dateValue: string, timeValue?: string) {
  const date = new Date(`${dateValue}T${timeValue || "12:00"}:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
}

function buildMatchNotifications(matches: Match[]): DynoNotificationItem[] {
  const now = Date.now();
  return matches
    .filter((match) => match.status !== "Annulé")
    .map((match) => {
      const matchDate = new Date(`${match.date}T${match.matchTime}:00`);
      const future = !Number.isNaN(matchDate.getTime()) && matchDate.getTime() >= now;
      const pending = match.responses.filter((response) => response.status === "En attente").length;
      const available = match.responses.filter((response) => response.status === "Disponible").length;

      return {
        id: `match-${match.id}-${match.status}-${match.responses.length}`,
        title: future ? `${match.type} contre ${match.opponent}` : `${match.type} terminé`,
        message: future
          ? `${formatDate(match.date, match.matchTime)} à ${match.matchTime.replace(":", "h")} · ${available} disponible${available > 1 ? "s" : ""}${pending ? ` · ${pending} en attente` : ""}`
          : `Retrouve le récapitulatif du rendez-vous contre ${match.opponent}.`,
        timeLabel: future ? "À venir" : "Historique",
        category: "scrim" as const,
        matchId: match.id,
      };
    })
    .sort((a, b) => (a.timeLabel === "À venir" && b.timeLabel !== "À venir" ? -1 : 0));
}

export async function getNotificationCenterItems(matches: Match[]): Promise<DynoNotificationItem[]> {
  const readIds = await getReadIds();
  const version = Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? "0.0.0";
  const systemItems: DynoNotificationItem[] = [
    {
      id: `system-version-${version}`,
      title: `DYNO ${version} installé`,
      message: "L’application est prête. Les nouveautés, correctifs et informations importantes apparaîtront ici.",
      timeLabel: "Système",
      category: "système",
    },
  ];

  return [...buildMatchNotifications(matches), ...systemItems].map((item) => ({
    ...item,
    read: readIds.has(item.id),
  }));
}

export async function markNotificationRead(id: string) {
  const ids = await getReadIds();
  ids.add(id);
  await saveReadIds(ids);
}

export async function markAllNotificationsRead(items: DynoNotificationItem[]) {
  const ids = await getReadIds();
  items.forEach((item) => ids.add(item.id));
  await saveReadIds(ids);
}

export async function getUnreadNotificationCount(matches: Match[]) {
  const items = await getNotificationCenterItems(matches);
  return items.filter((item) => !item.read).length;
}
