import webpush from "web-push";

export function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Missing VAPID keys.");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:dyno-esport-manager@users.noreply.github.com", publicKey, privateKey);
}

export async function sendWebPushNotifications(match, items) {
  const payload = JSON.stringify({
    title: `🟡 Nouveau ${(match.type || "match").toLowerCase()} DYNO`,
    body: `VS ${match.opponent || "Adversaire"} • ${shortDate(match.date)} • RDV ${match.arrivalTime || "?"} • Match ${match.matchTime || "?"} • ${match.arena || ""}`,
    tag: `dyno-${match.date || "match"}-${match.opponent || ""}`,
    url: "/Eva-Esport-Arena/",
  });
  let sent = 0;
  for (const item of items) {
    try {
      await webpush.sendNotification(item.subscription, payload, { TTL: 86400, urgency: "high" });
      sent += 1;
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) await item.ref.delete();
      else throw error;
    }
  }
  return sent;
}

function shortDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "Europe/Paris" }).format(date);
}
