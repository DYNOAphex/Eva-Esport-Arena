const CACHE_NAME = "dyno-web-v5";
const APP_ROOT = "/Eva-Esport-Arena/";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() ?? "Nouveau message DYNO" }; }
  event.waitUntil(self.registration.showNotification(payload.title || "DYNO Esport Manager", {
    body: payload.body || "Un nouveau scrim a été programmé.",
    icon: `${APP_ROOT}pwa-192.png`,
    badge: `${APP_ROOT}pwa-192.png`,
    tag: payload.tag || "dyno-match",
    data: { url: payload.url || APP_ROOT },
    vibrate: [200, 100, 200],
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || APP_ROOT;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    for (const client of windows) {
      if (client.url.includes(APP_ROOT) && "focus" in client) { client.navigate(target); return client.focus(); }
    }
    return clients.openWindow ? clients.openWindow(target) : undefined;
  }));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isNavigation = event.request.mode === "navigate";
  const requestUrl = new URL(event.request.url);
  const isAppAsset = requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith(APP_ROOT);
  if (isNavigation) {
    event.respondWith(fetch(event.request, { cache: "no-store" }).catch(() => caches.match(APP_ROOT)));
    return;
  }
  if (!isAppAsset) return;
  event.respondWith(fetch(event.request, { cache: "no-store" }).then((response) => {
    if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request)));
});
