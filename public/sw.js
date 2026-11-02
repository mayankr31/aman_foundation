/*
 * Aman Foundation – Impact Portal service worker.
 *
 * Kept intentionally small and dependency-free so it works with the Next.js
 * standalone Docker image without any build-plugin integration.
 *
 * Bump CACHE_VERSION whenever offline.html or the icons change so the new
 * shell replaces the old one. Hashed /_next/static assets do not need this.
 */
const CACHE_VERSION = "v1";
const PRECACHE = `aman-precache-${CACHE_VERSION}`;
const RUNTIME = `aman-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
// Generous enough for a slow first render, short enough to show the offline
// page instead of hanging forever on a dead connection.
const NAV_TIMEOUT_MS = 12000;
const MAX_RUNTIME_ENTRIES = 80;

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(PRECACHE);
        // Never let one missing optional asset reject the whole install.
        await Promise.all(
          PRECACHE_URLS.map(async (url) => {
            try {
              await cache.add(new Request(url, { cache: "reload" }));
            } catch (error) {
              // Ignore individual failures; the app still works online.
            }
          })
        );
      } catch (error) {
        // Storage can be unavailable in private browsing. Registration will
        // still succeed and the app keeps working without offline caching.
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key))
        );
      } catch (error) {
        // Cache cleanup is best-effort.
      }
      try {
        await self.clients.claim();
      } catch (error) {
        // Nothing else to do.
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isCacheableStatic(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    /\.(?:css|js|mjs|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|svg|ico)$/i.test(
      pathname
    )
  );
}

function isFontHost(hostname) {
  return (
    hostname === "fonts.googleapis.com" || hostname === "fonts.gstatic.com"
  );
}

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    await Promise.all(
      keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key))
    );
  } catch (error) {
    // Best-effort trimming.
  }
}

async function networkFirstNavigation(request) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NAV_TIMEOUT_MS);
    try {
      return await fetch(request, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    try {
      const cache = await caches.open(PRECACHE);
      const offline = await cache.match(OFFLINE_URL);
      if (offline) {
        // Respond with the cached page still under the requested URL so a
        // retry simply reloads the attempt the user originally made.
        return offline;
      }
    } catch (cacheError) {
      // Fall through to the inline fallback.
    }

    return new Response(
      "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Offline</title></head><body style=\"font-family:sans-serif;padding:2rem;text-align:center\"><h1>You are offline</h1><p>Please check your connection and try again.</p><button onclick=\"location.reload()\">Retry</button></body></html>",
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const network = fetch(request)
      .then(async (response) => {
        if (
          response &&
          response.ok &&
          response.type !== "opaque" &&
          !/no-store/i.test(response.headers.get("cache-control") || "")
        ) {
          try {
            await cache.put(request, response.clone());
            await trimCache(cacheName, MAX_RUNTIME_ENTRIES);
          } catch (error) {
            // Storage can be full or the response can be uncacheable.
          }
        }
        return response;
      })
      .catch(() => null);

    if (cached) return cached;

    const fresh = await network;
    if (fresh) return fresh;

    // Nothing cached and the network failed; let the browser surface the error.
    return fetch(request);
  } catch (error) {
    return fetch(request);
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    return;
  }

  // Never cache API responses, uploaded files, or Next.js RSC payloads.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/")
  ) {
    return;
  }
  if (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch")
  ) {
    return;
  }
  if (url.searchParams.has("_rsc")) return;
  if (request.headers.has("range")) return;

  // Google Fonts (Material Symbols and the public auth fonts).
  if (isFontHost(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
    return;
  }

  // Any other cross-origin request is left to the browser.
  if (url.origin !== self.location.origin) return;

  // The service worker script and manifest must always be revalidated, not
  // served from a runtime cache.
  if (url.pathname === "/sw.js" || url.pathname === "/manifest.webmanifest") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isCacheableStatic(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
  }
});
