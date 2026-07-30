/**
 * HuMob Service Worker — Phase 7.4 (FCM Push Notification)
 *
 * Security constraints:
 * - NO caching of authenticated routes or API responses.
 * - NO caching of /dashboard/* or any dynamic data.
 * - ONLY static shell assets are pre-cached.
 * - Private data (auth tokens, user data) never touches cache storage.
 */

// Firebase Messaging SW — required for background push messages
importScripts(
  "https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js",
);

// Initialize Firebase in the service worker context
// These values are public client-side config (not secrets)
firebase.initializeApp({
  apiKey: "AIzaSyARiEwMCFa0e2mpV2qs36TivKVbV4DZo4A",
  authDomain: "humob-252d3.firebaseapp.com",
  projectId: "humob-252d3",
  storageBucket: "humob-252d3.firebasestorage.app",
  messagingSenderId: "30482499455",
  appId: "1:30482499455:web:0f229cc28f0fa282edfc4a",
});

const messaging = firebase.messaging();

// Handle background push messages from FCM
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "HuMob";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: payload.data?.notification_id || "humob-default",
    data: {
      url: payload.data?.url || "/dashboard/notifications",
      notificationId: payload.data?.notification_id || "",
    },
    vibrate: [100, 50, 100],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================================
// Static shell caching (preserved from Phase 7.3)
// ============================================================

const CACHE_NAME = "humob-shell-v2";

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

  // Skip cross-origin requests (Supabase, Google, Firebase, CDNs).
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
        if (networkResponse.ok && SHELL_ASSETS.includes(url.pathname)) {
          const responseToCache = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      }),
  );
});

// Notification click — navigate to the notification URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard/notifications";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(targetUrl);
    }),
  );
});
