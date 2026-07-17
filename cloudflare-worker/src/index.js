const ALLOWED_ORIGINS = new Set([
  "https://dynoaphex.github.io",
  "http://localhost:8081",
  "http://localhost:19006",
]);

const GITHUB_API_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "DYNO-Cloudflare-Worker",
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "dyno-discord-notifier", githubAuth: "app" }, 200, cors);
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
        await triggerNotificationWorkflow(env);
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

async function triggerNotificationWorkflow(env) {
  const installationToken = await createInstallationToken(env);
  const response = await fetch(
    "https://api.github.com/repos/DYNOAphex/Eva-Esport-Arena/actions/workflows/discord-new-match.yml/dispatches",
    {
      method: "POST",
      headers: {
        ...GITHUB_API_HEADERS,
        Authorization: `Bearer ${installationToken}`,
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

async function createInstallationToken(env) {
  if (!env.GITHUB_APP_ID) throw new Error("GITHUB_APP_ID is not configured");
  if (!env.GITHUB_APP_INSTALLATION_ID) throw new Error("GITHUB_APP_INSTALLATION_ID is not configured");
  if (!env.GITHUB_APP_PRIVATE_KEY) throw new Error("GITHUB_APP_PRIVATE_KEY is not configured");

  const jwt = await createGitHubAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const response = await fetch(
    `https://api.github.com/app/installations/${encodeURIComponent(env.GITHUB_APP_INSTALLATION_ID)}/access_tokens`,
    {
      method: "POST",
      headers: {
        ...GITHUB_API_HEADERS,
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repositories: ["Eva-Esport-Arena"] }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub installation token failed (${response.status}): ${body.slice(0, 160)}`);
  }

  const data = await response.json();
  if (!data.token) throw new Error("GitHub installation token is missing");
  return data.token;
}

async function createGitHubAppJwt(appId, pem) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "RS256", typ: "JWT" });
  const payload = base64UrlJson({ iat: now - 60, exp: now + 540, iss: String(appId) });
  const unsigned = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );
  return `${unsigned}.${base64UrlBytes(new Uint8Array(signature))}`;
}

function pemToPkcs8(pem) {
  const normalized = String(pem).replace(/\\n/g, "\n").trim();
  const isPkcs1 = normalized.includes("BEGIN RSA PRIVATE KEY");
  const base64 = normalized
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, "")
    .replace(/-----END (RSA )?PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const der = base64ToBytes(base64);
  return isPkcs1 ? wrapPkcs1AsPkcs8(der).buffer : der.buffer;
}

function wrapPkcs1AsPkcs8(pkcs1) {
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const algorithm = new Uint8Array([
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00,
  ]);
  const privateKey = concatBytes(new Uint8Array([0x04]), derLength(pkcs1.length), pkcs1);
  const body = concatBytes(version, algorithm, privateKey);
  return concatBytes(new Uint8Array([0x30]), derLength(body.length), body);
}

function derLength(length) {
  if (length < 128) return new Uint8Array([length]);
  const bytes = [];
  let value = length;
  while (value > 0) {
    bytes.unshift(value & 0xff);
    value >>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function concatBytes(...parts) {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
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
