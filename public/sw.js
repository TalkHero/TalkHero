const CACHE_PREFIX = "talkhero";
const CACHE_VERSION = "rc1-v1";
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.ico",
  "/pwa/icon-192",
  "/pwa/icon-512",
  "/pwa/icon-maskable-512",
  "/pwa/apple-icon",
];

function isHttpRequest(request) {
  return (
    request.url.startsWith("http://") || request.url.startsWith("https://")
  );
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isNextStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isPwaAsset(url) {
  return (
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === OFFLINE_URL ||
    url.pathname.startsWith("/pwa/")
  );
}

async function precacheResources() {
  const cache = await caches.open(STATIC_CACHE);

  await Promise.allSettled(
    PRECACHE_URLS.map(async (url) => {
      const response = await fetch(url, {
        cache: "reload",
      });

      if (!response.ok) {
        throw new Error(`Не вдалося кешувати ${url}: ${response.status}`);
      }

      await cache.put(url, response);
    }),
  );
}

async function deleteOldCaches() {
  const cacheNames = await caches.keys();

  const oldCaches = cacheNames.filter(
    (cacheName) =>
      cacheName.startsWith(`${CACHE_PREFIX}-`) && cacheName !== STATIC_CACHE,
  );

  await Promise.all(oldCaches.map((cacheName) => caches.delete(cacheName)));
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);

  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse.ok && networkResponse.type === "basic") {
    await cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

async function networkWithOfflineFallback(request, preloadResponsePromise) {
  try {
    const preloadResponse = await preloadResponsePromise;

    if (preloadResponse) {
      return preloadResponse;
    }

    return await fetch(request);
  } catch {
    const cache = await caches.open(STATIC_CACHE);

    const offlineResponse = await cache.match(OFFLINE_URL);

    if (offlineResponse) {
      return offlineResponse;
    }

    return new Response("Немає з’єднання з інтернетом.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await precacheResources();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await deleteOldCaches();

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || !isHttpRequest(request)) {
    return;
  }

  const url = new URL(request.url);

  if (!isSameOrigin(url) || isApiRequest(url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      networkWithOfflineFallback(request, event.preloadResponse),
    );

    return;
  }

  if (isNextStaticAsset(url) || isPwaAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});
