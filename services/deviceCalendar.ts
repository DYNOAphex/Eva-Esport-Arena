import * as Calendar from "expo-calendar";
import { Platform } from "react-native";

import type { Match } from "./matchStore";

async function getWritableCalendarId() {
  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Permission calendrier refusée.");
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((calendar) => calendar.allowsModifications);
  if (writable) return writable.id;

  if (Platform.OS === "ios") {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.id;
  }

  const source = calendars.find((calendar) => calendar.source?.isLocalAccount)?.source;
  const sourceId = source?.id;
  const sourceName = source?.name ?? "DYNO";

  return Calendar.createCalendarAsync({
    title: "DYNO Esport",
    color: "#D4AF37",
    entityType: Calendar.EntityTypes.EVENT,
    sourceId,
    source: {
      id: sourceId ?? "dyno-local",
      name: sourceName,
      type: source?.type ?? Calendar.SourceType.LOCAL,
      isLocalAccount: true,
    },
    name: "dyno-esport",
    ownerAccount: "personal",
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export async function addMatchToDeviceCalendar(match: Match) {
  const calendarId = await getWritableCalendarId();
  const startDate = new Date(`${match.date}T${match.matchTime}:00`);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error("Date du match invalide.");
  }

  const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
  const arrival = match.arrivalTime ? `Rendez-vous : ${match.arrivalTime}\n` : "";

  return Calendar.createEventAsync(calendarId, {
    title: `${match.type} DYNO vs ${match.opponent}`,
    startDate,
    endDate,
    location: match.arena,
    notes: `${arrival}Début du match : ${match.matchTime}\nStatut : ${match.status}${match.notes ? `\n\n${match.notes}` : ""}`,
    alarms: [{ relativeOffset: -30 }],
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}
