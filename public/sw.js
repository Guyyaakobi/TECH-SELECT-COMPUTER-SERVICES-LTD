// Service Worker for TECH-SELECT Hours PWA ("שעות לחיוב לקוח")
// Versioned cache name - updates on each deploy
const CACHE_VERSION = "techselect-hours-v2026-10-31-v7";
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Immutable icon/manifest assets only (never precache JS bundles)
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/favicon.svg",
  "/pwa-192x192.png",
  "/pwa-192x192.png"
];

// Helper: Check if a request is an API or auth request that MUST NEVER be cached
function isNetworkOnlyRequest(request) {
  if (request.method !== "GET") return true;

  const url = new URL(request.url);

  // 1. Never cache /api/* endpoints or Vite dev module paths
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/@")
  ) {
    return true;
  }

  // 2. Never cache auth/login/token endpoints or external OAuth/Graph services
  if (
    url.pathname.includes("/auth") ||
    url.pathname.includes("/login") ||
    url.pathname.includes("/token") ||
    url.hostname.includes("login.microsoftonline.com") ||
    url.hostname.includes("graph.microsoft.com") ||
    url.searchParams.has("code") ||
    url.searchParams.has("access_token")
  ) {
    return true;
  }

  // 3. Never cache requests with Authorization header
  if (request.headers && request.headers.has("Authorization")) {
    return true;
  }

  return false;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Pre-cache non-fatal error:", err);
      });
    })
  );
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  // Claim all active clients immediately
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 1. NEVER cache /api/*, dev modules, or auth requests - purely network only
  if (isNetworkOnlyRequest(request)) {
    return;
  }

  // 2. Network-First for all navigation, HTML, JS, and CSS so new deploys always show immediately
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          request.method === "GET" &&
          new URL(request.url).origin === self.location.origin
        ) {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await caches.match("/");
          if (fallback) return fallback;
        }
        return Response.error();
      })
  );
});
