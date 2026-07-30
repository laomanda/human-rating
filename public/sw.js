/**
 * HuMob Service Worker — Foundation (Phase 7.3)
 *
 * Security constraints:
 * - NO caching of authenticated routes or API responses.
 * - NO caching of /dashboard/* or any dynamic data.
 * - ONLY static shell assets are pre-cached.
 * - Private data (auth tokens, user data) never touches cache storage.
 *
 * This SW is intentionally minimal to serve as a foundation for
 * future push notification integration (Phase 7.4) without
 * compromising security.
 */

const CACHE_NAME = "humob-shell-v1";

// Static public assets that are safe to cache.
// Intentionally excludes /dashboard, /api, and any auth routes.
const SHELL_ASSETS = ["/", "/login", "/icon-192x192.png", "/icon-512x512.png"];

// Install: pre-cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Activate: remove stale caches from previous SW versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: network-first for all requests.
// Only fall back to cache for shell assets. Never cache authenticated content.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests entirely.
  if (request.method !== "GET") return;

  // Skip cross-origin requests (Supabase, Google, CDNs).
  if (url.origin !== self.location.origin) return;

  // Skip authenticated/dynamic routes — let the browser handle them normally.
  const blockedPrefixes = [
    "/dashboard",
    "/api",
    "/auth",
    "/onboarding",
    "/_next/data",
  ];
  if (blockedPrefixes.some((prefix) => url.pathname.startsWith(prefix)))
    return;

  // For shell assets: network-first, fall back to cache.
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Only cache successful responses for known shell assets.
        if (
          networkResponse.ok &&
          SHELL_ASSETS.includes(url.pathname)
        ) {
          const responseToCache = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — try cache as last resort (shell assets only).
        return caches.match(request);
      }),
  );
});

// Push notification listener — ready for Phase 7.4 (FCM/VAPID).
// Registered here as a no-op foundation so the SW lifecycle is stable.
self.addEventListener("push", (_event) => {
  // Phase 7.4: Implement FCM push notification handling here.
});

// Notification click — ready for Phase 7.4.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/dashboard");
    }),
  );
});
