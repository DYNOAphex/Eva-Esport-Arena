import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();

const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");

type MatchDocument = {
  type?: string;
  opponent?: string;
  date?: string;
  arrivalTime?: string;
  matchTime?: string;
  arena?: string;
  status?: string;
};

export const notifyNewMatch = onDocumentCreated(
  {
    document: "matches/{matchId}",
    region: "europe-west1",
    secrets: [discordWebhookUrl],
  },
  async (event) => {
    const match = event.data?.data() as MatchDocument | undefined;
    if (!match) return;

    const type = match.type || "Match";
    const opponent = match.opponent || "Adversaire";
    const date = match.date || "Date à confirmer";
    const arrivalTime = match.arrivalTime || "À confirmer";
    const matchTime = match.matchTime || "À confirmer";
    const arena = match.arena || "Arène à confirmer";

    await Promise.allSettled([
      sendDiscordNotification({ type, opponent, date, arrivalTime, matchTime, arena }),
      sendExpoPushNotifications({ type, opponent, date, arrivalTime, matchTime, arena }),
    ]);
  },
);

async function sendDiscordNotification(match: Required<Pick<MatchDocument, "type" | "opponent" | "date" | "arrivalTime" | "matchTime" | "arena">>) {
  const response = await fetch(discordWebhookUrl.value(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "DYNO Esport Manager",
      embeds: [
        {
          title: `🟡 NOUVEAU ${match.type.toUpperCase()}`,
          description: `**🆚 DYNO vs ${match.opponent}**`,
          color: 13938487,
          fields: [
            { name: "📅 Date", value: formatFrenchDate(match.date), inline: false },
            { name: "⏰ Rendez-vous", value: match.arrivalTime, inline: true },
            { name: "🎮 Match", value: match.matchTime, inline: true },
            { name: "🏟 Arène", value: match.arena, inline: true },
          ],
          footer: { text: "✅ Répondez dans l'application DYNO" },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status}`);
  }
}

async function sendExpoPushNotifications(match: Required<Pick<MatchDocument, "type" | "opponent" | "date" | "arrivalTime" | "matchTime" | "arena">>) {
  const users = await getFirestore().collection("users").get();
  const messages = users.docs
    .map((document) => document.get("expoPushToken"))
    .filter((token): token is string => typeof token === "string" && token.startsWith("ExponentPushToken"))
    .map((to) => ({
      to,
      sound: "default",
      title: `🟡 Nouveau ${match.type.toLowerCase()} DYNO`,
      body: `VS ${match.opponent} • ${formatFrenchDate(match.date)} • RDV ${match.arrivalTime} • Match ${match.matchTime} • ${match.arena}`,
      data: { type: "match-created", opponent: match.opponent },
      channelId: "matches",
    }));

  if (!messages.length) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push failed: ${response.status}`);
  }
}

function formatFrenchDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
