import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
if (!webhookUrl) {
  throw new Error("Missing DISCORD_WEBHOOK_URL secret.");
}

// Only matches created after the free notification workflow was released are eligible.
// This lets older installed APKs work without announcing historical matches.
const ROLLOUT_DATE = new Date("2026-07-14T13:53:55.000Z");

initializeApp({
  credential: applicationDefault(),
  projectId: "eva-esport-arena",
});

const db = getFirestore();
const snapshot = await db.collection("matches").limit(100).get();
const pendingDocuments = snapshot.docs
  .filter((document) => shouldNotify(document.data()))
  .sort((a, b) => dateValue(a.data().createdAt) - dateValue(b.data().createdAt))
  .slice(0, 20);

if (!pendingDocuments.length) {
  console.log("No pending Discord announcements.");
  process.exit(0);
}

for (const document of pendingDocuments) {
  const match = document.data();

  try {
    await sendDiscordNotification(match);
    await document.ref.update({
      discordNotificationPending: false,
      discordNotifiedAt: new Date().toISOString(),
    });
    console.log(`Discord announcement sent for match ${document.id}.`);
  } catch (error) {
    console.error(`Failed to notify match ${document.id}.`, error);
    process.exitCode = 1;
  }
}

function shouldNotify(match) {
  if (typeof match.discordNotifiedAt === "string" && match.discordNotifiedAt.trim()) return false;
  if (match.discordNotificationPending === true) return true;

  // Compatibility for matches created by APKs installed before the pending flag existed.
  const createdAt = new Date(match.createdAt);
  return !Number.isNaN(createdAt.getTime()) && createdAt >= ROLLOUT_DATE;
}

async function sendDiscordNotification(match) {
  const type = stringOr(match.type, "match").toLowerCase();
  const opponent = stringOr(match.opponent, "Adversaire");
  const date = formatFrenchDate(stringOr(match.date, "Date à confirmer"));
  const arrivalTime = stringOr(match.arrivalTime, "À confirmer");
  const matchTime = stringOr(match.matchTime, "À confirmer");
  const arena = stringOr(match.arena, "Arène à confirmer");
  const notes = stringOr(match.notes, "").trim();

  const fields = [
    { name: "📅 Date", value: date, inline: false },
    { name: "⏰ Rendez-vous", value: arrivalTime, inline: true },
    { name: "🎮 Match", value: matchTime, inline: true },
    { name: "🏟 Arène", value: arena, inline: true },
  ];

  if (notes) {
    fields.push({ name: "📝 Notes", value: notes.slice(0, 1024), inline: false });
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "DYNO Esport Manager",
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: `🏆 Nouveau ${type} DYNO`,
          description: `**DYNO 🆚 ${opponent}**`,
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
    const body = await response.text();
    throw new Error(`Discord webhook failed (${response.status}): ${body.slice(0, 200)}`);
  }
}

function stringOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function dateValue(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}

function formatFrenchDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(date);
}
