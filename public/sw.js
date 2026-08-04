/**
 * HuMob Service Worker
 *
 * Tujuan worker ini sederhana: mencegah error registration dan
 * memastikan shell aplikasi tetap tersedia saat offline untuk route publik.
 */

const CACHE_NAME = "humob-shell-v2";
const SHELL_ASSETS = ["/", "/login", "/icon-192x192.png", "/icon-512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  const blockedPrefixes = ["/dashboard", "/api", "/auth", "/onboarding", "/_next/data"];
  if (blockedPrefixes.some((prefix) => url.pathname.startsWith(prefix))) return;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok && SHELL_ASSETS.includes(url.pathname)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request)),
  );
});
