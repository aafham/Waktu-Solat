const CACHE_VERSION = "v19";
const APP_CACHE = `waktu-solat-app-${CACHE_VERSION}`;
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./prayer-data.js",
  "./location-service.js",
  "./islamic-calendar.js",
  "./islamic-calendar-data.js",
  "./islamic-references.js",
  "./islamic-calendar-view.js",
  "./islamic-calendar.css",
  "./event-countdown.js",
  "./qibla.js",
  "./zones.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
].map((path) => new URL(path, self.registration.scope).href);

const ROOT_URL = new URL("./", self.registration.scope);
const INDEX_URL = new URL("./index.html", self.registration.scope).href;
const SHELL_PATHS = new Map(
  APP_SHELL.map((url) => [new URL(url).pathname, url]),
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      await cache.addAll(
        APP_SHELL.map((url) => new Request(url, { cache: "reload" })),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) => name.startsWith("waktu-solat-") && name !== APP_CACHE,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

async function saveResponse(cache, key, response) {
  if (!response.ok || response.type === "opaque") return;
  try {
    await cache.put(key, response.clone());
  } catch {
    // Full or unavailable browser storage must not prevent a successful response.
  }
}

async function navigate(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await saveResponse(cache, INDEX_URL, response);
      return response;
    }
    return (await cache.match(INDEX_URL)) || response;
  } catch {
    return (await cache.match(INDEX_URL)) || Response.error();
  }
}

async function shellAsset(request, key) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(key);
  if (cached) return cached;
  const response = await fetch(request);
  await saveResponse(cache, key, response);
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== ROOT_URL.origin) return;

  const isAppEntry =
    url.pathname === ROOT_URL.pathname ||
    url.pathname === new URL(INDEX_URL).pathname;
  if (event.request.mode === "navigate") {
    if (isAppEntry) event.respondWith(navigate(event.request));
    return;
  }

  const key = SHELL_PATHS.get(url.pathname);
  if (key) event.respondWith(shellAsset(event.request, key));
  // API requests and unrelated same-origin resources bypass the worker.
  // prayer-data.js alone owns the validated zone-and-month data cache.
});
