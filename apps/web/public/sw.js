// Minimal service worker: just enough for PWA installability (a required
// criterion for Play Store TWA packaging) plus a friendly offline page.
// It deliberately does NOT cache API responses or app pages — this app's
// data (bookings, payments, messages) is live and session-scoped, so
// serving a cached copy would be actively misleading rather than helpful.
const OFFLINE_CACHE = "lumen-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== OFFLINE_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.open(OFFLINE_CACHE).then((cache) => cache.match(OFFLINE_URL))),
  );
});
