import { initializeApp } from "firebase-admin/app";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();

const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");

type MatchDocument = {
  type?: string;
  opponent?: string;
  date?: string;
  arrivalTime?: string;
  matchTime?: string;
  matchTimeAlt?: string;
  arena?: string;
  notes?: string;
  discordNotifiedAt?: string;
};

export const notifyNewMatch = onDocumentCreated(
  {
    document: "matches/{matchId}",
    region: "europe-west1",
    secrets: [discordWebhookUrl],
  },
  async (event) => {
    if (!event.data) return;

    const currentDocument = await event.data.ref.get();
    const currentData = currentDocument.data() as MatchDocument | undefined;
    if (!currentData || currentData.discordNotifiedAt) return;

    const match = {
      type: currentData.type || "Match",
      opponent: currentData.opponent || "Adversaire",
      date: currentData.date || "Date à confirmer",
      matchTime: currentData.matchTime || "À confirmer",
      matchTimeAlt: currentData.matchTimeAlt || "",
      arena: currentData.arena || "Arène à confirmer",
      notes: currentData.notes || "",
    };

    try {
      await sendDiscordNotification(match);
      await event.data.ref.update({ discordNotifiedAt: new Date().toISOString() });
    } catch (error) {
      logger.error("Discord notification failed", {
        matchId: event.params.matchId,
        error,
      });
      throw error;
    }
  },
);

async function sendDiscordNotification(match: {
  type: string;
  opponent: string;
  date: string;
  matchTime: string;
  matchTimeAlt: string;
  arena: string;
  notes: string;
}) {
  const fields = [
    { name: "📅 Date", value: formatFrenchDate(match.date), inline: false },
    { name: "🎮 Horaires possibles", value: formatTimeOptions(match.matchTime, match.matchTimeAlt), inline: true },
    { name: "🏟 Arène", value: match.arena, inline: true },
  ];

  if (match.notes.trim()) {
    fields.push({ name: "📝 Notes", value: match.notes.trim().slice(0, 1024), inline: false });
  }

  const response = await fetch(discordWebhookUrl.value(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "DYNO Esport Manager",
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: `🏆 Nouveau ${match.type.toLowerCase()} DYNO`,
          description: `**DYNO 🆚 ${match.opponent}**`,
          color: 13938487,
          fields,
          footer: {
            text: "📲 Merci d'indiquer votre disponibilité dans l'application DYNO.",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Discord webhook failed (${response.status}): ${responseBody.slice(0, 200)}`);
  }
}

function formatTime(value: string) {
  return value ? value.replace(":", "h") : value;
}

function formatTimeOptions(first: string, second?: string) {
  return second ? `${formatTime(first)} / ${formatTime(second)}` : formatTime(first);
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
