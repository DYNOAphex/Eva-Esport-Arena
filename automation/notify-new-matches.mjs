import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { configureWebPush, sendWebPushNotifications } from "./web-push.mjs";

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
if (!webhookUrl) throw new Error("Missing DISCORD_WEBHOOK_URL secret.");
configureWebPush();

initializeApp({ credential: applicationDefault(), projectId: "eva-esport-arena" });
const db = getFirestore();
const [matchSnapshot, userSnapshot, webSnapshot] = await Promise.all([
  db.collection("matches").limit(100).get(),
  db.collection("users").limit(100).get(),
  db.collectionGroup("webPushSubscriptions").limit(200).get(),
]);
const today = todayInParis();
const expoTokens = [...new Set(userSnapshot.docs.map((doc) => doc.data().expoPushToken).filter((token) => typeof token === "string" && /^(Exponent|Expo)PushToken\[/.test(token)))];
const webSubscriptions = webSnapshot.docs.map((doc) => ({ ref: doc.ref, subscription: { endpoint: doc.data().endpoint, keys: { p256dh: doc.data().p256dh, auth: doc.data().auth } } })).filter((item) => item.subscription.endpoint && item.subscription.keys.p256dh && item.subscription.keys.auth);

console.log(`Firestore matches found: ${matchSnapshot.size}.`);
console.log(`Expo push tokens found: ${expoTokens.length}.`);
console.log(`Web Push subscriptions found: ${webSubscriptions.length}.`);

const discordDocs = pending("discordNotifiedAt");
const mobileDocs = pending("pushNotifiedAt");
const webDocs = pending("webPushNotifiedAt");

for (const document of discordDocs) {
  try {
    await sendDiscordNotification(document.data());
    await document.ref.update({ discordNotificationPending: false, discordNotifiedAt: new Date().toISOString() });
    console.log(`Discord announcement sent for match ${document.id}.`);
  } catch (error) { console.error(error); process.exitCode = 1; }
}

if (!expoTokens.length && mobileDocs.length) console.log("No Expo push token registered yet; mobile pushes remain pending.");
for (const document of expoTokens.length ? mobileDocs : []) {
  try {
    await sendExpoPushNotifications(document.data(), expoTokens);
    await document.ref.update({ pushNotifiedAt: new Date().toISOString() });
    console.log(`Mobile push sent for match ${document.id} to ${expoTokens.length} device(s).`);
  } catch (error) { console.error(error); process.exitCode = 1; }
}

if (!webSubscriptions.length && webDocs.length) console.log("No Web Push subscription registered yet; web pushes remain pending.");
for (const document of webSubscriptions.length ? webDocs : []) {
  try {
    const sent = await sendWebPushNotifications(document.data(), webSubscriptions);
    await document.ref.update({ webPushNotifiedAt: new Date().toISOString() });
    console.log(`Web Push sent for match ${document.id} to ${sent} device(s).`);
  } catch (error) { console.error(error); process.exitCode = 1; }
}

function pending(field) {
  return matchSnapshot.docs.filter((doc) => shouldNotify(doc.data(), field)).sort((a, b) => dateValue(a.data().createdAt) - dateValue(b.data().createdAt)).slice(0, 20);
}
function shouldNotify(match, field) {
  if (typeof match[field] === "string" && match[field].trim()) return false;
  if (match.status === "Annulé") return false;
  const date = typeof match.date === "string" ? match.date.trim() : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date >= today) return true;
  const createdAt = new Date(match.createdAt);
  return !Number.isNaN(createdAt.getTime()) && createdAt.getTime() >= Date.now() - 7 * 86400000;
}
async function sendExpoPushNotifications(match, tokens) {
  const title = `🟡 Nouveau ${stringOr(match.type, "match").toLowerCase()} DYNO`;
  const body = `VS ${stringOr(match.opponent, "Adversaire")} • ${shortDate(match.date)} • RDV ${stringOr(match.arrivalTime, "?")} • Match ${stringOr(match.matchTime, "?")} • ${stringOr(match.arena, "")}`;
  const response = await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(tokens.map((to) => ({ to, title, body, sound: "default", channelId: "matches", priority: "high" }))) });
  if (!response.ok) throw new Error(`Expo push failed (${response.status})`);
}
async function sendDiscordNotification(match) {
  const fields = [
    { name: "📅 Date", value: longDate(match.date), inline: false },
    { name: "⏰ Rendez-vous", value: stringOr(match.arrivalTime, "À confirmer"), inline: true },
    { name: "🎮 Match", value: stringOr(match.matchTime, "À confirmer"), inline: true },
    { name: "🏟 Arène", value: stringOr(match.arena, "À confirmer"), inline: true },
  ];
  const response = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "DYNO Esport Manager", embeds: [{ title: `🏆 Nouveau ${stringOr(match.type, "match").toLowerCase()} DYNO`, description: `**DYNO 🆚 ${stringOr(match.opponent, "Adversaire")}**`, color: 13938487, fields }] }) });
  if (!response.ok) throw new Error(`Discord webhook failed (${response.status})`);
}
function stringOr(value, fallback) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function dateValue(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime(); }
function todayInParis() { return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Paris" }).format(new Date()); }
function shortDate(value) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "Europe/Paris" }).format(date); }
function longDate(value) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(date); }
