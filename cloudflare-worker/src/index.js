const ALLOWED_ORIGINS = new Set([
  "https://dynoaphex.github.io",
  "http://localhost:8081",
  "http://localhost:19006",
]);

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "dyno-discord-notifier" }, 200, cors);
    }

    if (request.method !== "POST" || url.pathname !== "/notify-match") {
      return json({ error: "Not found" }, 404, cors);
    }

    try {
      const token = bearerToken(request.headers.get("Authorization"));
      if (!token) return json({ error: "Authentication required" }, 401, cors);

      const account = await verifyFirebaseToken(token, env.FIREBASE_API_KEY);
      if (!account?.localId) return json({ error: "Invalid Firebase session" }, 401, cors);

      const payload = await request.json();
      const match = validateMatch(payload);

      await sendDiscord(env.DISCORD_WEBHOOK_URL, match, account.email || "");

      let webPushTriggered = false;
      try {
        await triggerNotificationWorkflow(env.GITHUB_WORKFLOW_TOKEN);
        webPushTriggered = true;
      } catch (error) {
        console.error("GitHub workflow dispatch failed", error);
      }

      return json({ ok: true, discord: "sent", webPushTriggered }, 200, cors);
    } catch (error) {
      console.error(error);
      return json({ error: error instanceof Error ? error.message : "Notification failed" }, 500, cors);
    }
  },
};

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://dynoaphex.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function bearerToken(value) {
  if (!value?.startsWith("Bearer ")) return "";
  return value.slice(7).trim();
}

async function verifyFirebaseToken(idToken, apiKey) {
  if (!apiKey) throw new Error("FIREBASE_API_KEY is not configured");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.users?.[0] ?? null;
}

async function triggerNotificationWorkflow(token) {
  if (!token) throw new Error("GITHUB_WORKFLOW_TOKEN is not configured");

  const response = await fetch(
    "https://api.github.com/repos/DYNOAphex/Eva-Esport-Arena/actions/workflows/discord-new-match.yml/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "DYNO-Cloudflare-Worker",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub workflow dispatch failed (${response.status}): ${body.slice(0, 160)}`);
  }
}

function validateMatch(value) {
  if (!value || typeof value !== "object") throw new Error("Invalid match payload");
  const opponent = clean(value.opponent, 80);
  const type = clean(value.type || "Scrim", 30);
  const date = clean(value.date, 10);
  const arrivalTime = clean(value.arrivalTime, 5);
  const matchTime = clean(value.matchTime, 5);
  const arena = clean(value.arena, 40);
  const notes = clean(value.notes || "", 500);
  if (!opponent || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Missing match information");
  return { opponent, type, date, arrivalTime, matchTime, arena, notes };
}

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function sendDiscord(webhookUrl, match, creatorEmail) {
  if (!webhookUrl) throw new Error("DISCORD_WEBHOOK_URL is not configured");
  const fields = [
    { name: "📅 Date", value: formatFrenchDate(match.date), inline: false },
    { name: "⏰ Rendez-vous", value: match.arrivalTime || "À confirmer", inline: true },
    { name: "🎮 Match", value: match.matchTime || "À confirmer", inline: true },
    { name: "🏟 Arène", value: match.arena || "À confirmer", inline: true },
  ];
  if (match.notes) fields.push({ name: "📝 Notes", value: match.notes, inline: false });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "DYNO Esport Manager",
      allowed_mentions: { parse: [] },
      embeds: [{
        title: `🏆 Nouveau ${match.type.toLowerCase()} DYNO`,
        description: `**DYNO 🆚 ${match.opponent}**`,
        color: 13938487,
        fields,
        footer: { text: creatorEmail ? `Créé depuis DYNO par ${creatorEmail}` : "Créé depuis DYNO" },
        timestamp: new Date().toISOString(),
      }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord webhook failed (${response.status}): ${body.slice(0, 160)}`);
  }
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

function json(value, status, headers) {
  return new Response(JSON.stringify(value), { status, headers });
}
