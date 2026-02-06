const CACHE_VERSION = "v3";
const APP_CACHE = `waktu-solat-app-${CACHE_VERSION}`;
const DATA_CACHE = `waktu-solat-data-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_CACHE, DATA_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (APP_SHELL.includes(url.pathname) || url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(APP_CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        });
      })
    );
    return;
  }

  if (url.hostname.includes("e-solat.gov.my") || url.hostname.includes("waktusolat.app")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
