// Service Worker for TECH-SELECT Hours PWA ("תיעוד שעות")
// Versioned cache name - updates on each deploy
const CACHE_VERSION = "techselect-hours-v2026-09-30-v2";
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Immutable or pre-cached static assets
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/favicon.svg",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/pwa-maskable-512x512.png"
];

// Helper: Check if a request is an API or auth request that MUST NEVER be cached
function isNetworkOnlyRequest(request) {
  if (request.method !== "GET") return true;

  const url = new URL(request.url);

  // 1. Never cache /api/* endpoints
  if (url.pathname.startsWith("/api/")) return true;

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

// Helper: Check if a request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);

  // Only consider same-origin or static CDNs
  if (url.origin !== self.location.origin) {
    return false;
  }

  // File extension checks
  const staticExtensions = [
    ".js", ".css", ".svg", ".png", ".jpg", ".jpeg",
    ".webp", ".woff", ".woff2", ".ttf", ".ico", ".json"
  ];

  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
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

  // 1. NEVER cache /api/* or auth requests - purely network only
  if (isNetworkOnlyRequest(request)) {
    return; // Pass through to standard browser network request
  }

  // 2. Only cache GET requests for static assets
  if (isStaticAsset(request)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Fetch updated version in background to keep cache fresh
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (fetchErr) {
          return cachedResponse || Response.error();
        }
      })
    );
    return;
  }

  // 3. For HTML navigation documents, use network-first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/");
      })
    );
    return;
  }
});
