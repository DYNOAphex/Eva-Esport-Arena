import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
if (!webhookUrl) throw new Error("Missing DISCORD_WEBHOOK_URL secret.");

initializeApp({ credential: applicationDefault(), projectId: "eva-esport-arena" });
const db = getFirestore();
const [matchSnapshot, userSnapshot] = await Promise.all([
  db.collection("matches").limit(100).get(),
  db.collection("users").limit(100).get(),
]);
const today = todayInParis();
const pushTokens = [...new Set(userSnapshot.docs.map((doc) => doc.data().expoPushToken).filter((token) => typeof token === "string" && /^(Exponent|Expo)PushToken\[/.test(token)))];

console.log(`Firestore matches found: ${matchSnapshot.size}.`);
console.log(`Expo push tokens found: ${pushTokens.length}.`);

const discordDocuments = matchSnapshot.docs.filter((doc) => shouldDiscordNotify(doc.data(), today)).sort(sortByCreatedAt).slice(0, 20);
const pushDocuments = matchSnapshot.docs.filter((doc) => shouldPushNotify(doc.data(), today)).sort(sortByCreatedAt).slice(0, 20);

console.log(`Discord announcements pending: ${discordDocuments.length}.`);
console.log(`Mobile push announcements pending: ${pushDocuments.length}.`);

for (const document of discordDocuments) {
  try {
    await sendDiscordNotification(document.data());
    await document.ref.update({ discordNotificationPending: false, discordNotifiedAt: new Date().toISOString() });
    console.log(`Discord announcement sent for match ${document.id}.`);
  } catch (error) {
    console.error(`Failed to notify Discord for match ${document.id}.`, error);
    process.exitCode = 1;
  }
}

for (const document of pushDocuments) {
  try {
    if (pushTokens.length) await sendExpoPushNotifications(document.data(), pushTokens);
    await document.ref.update({ pushNotifiedAt: new Date().toISOString() });
    console.log(`Mobile push sent for match ${document.id} to ${pushTokens.length} device(s).`);
  } catch (error) {
    console.error(`Failed to send mobile push for match ${document.id}.`, error);
    process.exitCode = 1;
  }
}

if (!discordDocuments.length) console.log("No pending Discord announcements.");
if (!pushDocuments.length) console.log("No pending mobile push announcements.");

function shouldDiscordNotify(match, todayValue) {
  if (typeof match.discordNotifiedAt === "string" && match.discordNotifiedAt.trim()) return false;
  return isEligible(match, todayValue) || match.discordNotificationPending === true;
}

function shouldPushNotify(match, todayValue) {
  if (typeof match.pushNotifiedAt === "string" && match.pushNotifiedAt.trim()) return false;
  return isEligible(match, todayValue);
}

function isEligible(match, todayValue) {
  if (match.status === "Annulé") return false;
  const matchDate = typeof match.date === "string" ? match.date.trim() : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(matchDate) && matchDate >= todayValue) return true;
  const createdAt = new Date(match.createdAt);
  return !Number.isNaN(createdAt.getTime()) && createdAt.getTime() >= Date.now() - 7 * 86400000;
}

async function sendExpoPushNotifications(match, tokens) {
  const title = `🟡 Nouveau ${stringOr(match.type, "match").toLowerCase()} DYNO`;
  const body = `VS ${stringOr(match.opponent, "Adversaire")} • ${formatShortDate(stringOr(match.date, ""))} • RDV ${stringOr(match.arrivalTime, "?")} • Match ${stringOr(match.matchTime, "?")} • ${stringOr(match.arena, "")}`;
  const messages = tokens.map((to) => ({ to, title, body, sound: "default", channelId: "matches", priority: "high", data: { type: "match-created", matchId: match.id ?? "" } }));
  const response = await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(messages) });
  if (!response.ok) throw new Error(`Expo push failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  const result = await response.json();
  console.log("Expo push response:", JSON.stringify(result));
}

async function sendDiscordNotification(match) {
  const type = stringOr(match.type, "match").toLowerCase();
  const opponent = stringOr(match.opponent, "Adversaire");
  const fields = [
    { name: "📅 Date", value: formatFrenchDate(stringOr(match.date, "Date à confirmer")), inline: false },
    { name: "⏰ Rendez-vous", value: stringOr(match.arrivalTime, "À confirmer"), inline: true },
    { name: "🎮 Match", value: stringOr(match.matchTime, "À confirmer"), inline: true },
    { name: "🏟 Arène", value: stringOr(match.arena, "Arène à confirmer"), inline: true },
  ];
  const notes = stringOr(match.notes, "").trim();
  if (notes) fields.push({ name: "📝 Notes", value: notes.slice(0, 1024), inline: false });
  const response = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "DYNO Esport Manager", allowed_mentions: { parse: [] }, embeds: [{ title: `🏆 Nouveau ${type} DYNO`, description: `**DYNO 🆚 ${opponent}**`, color: 13938487, fields, footer: { text: "📲 Merci d'indiquer votre disponibilité dans l'application DYNO." }, timestamp: new Date().toISOString() }] }) });
  if (!response.ok) throw new Error(`Discord webhook failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
}

function sortByCreatedAt(a, b) { return dateValue(a.data().createdAt) - dateValue(b.data().createdAt); }
function stringOr(value, fallback) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function dateValue(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime(); }
function todayInParis() { return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Paris" }).format(new Date()); }
function formatShortDate(value) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "Europe/Paris" }).format(date); }
function formatFrenchDate(value) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(date); }
