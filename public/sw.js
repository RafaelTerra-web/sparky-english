const CACHE_NAME = "sparky-public-v10";
// Development chunk URLs are reused between edits. Never serve cached app code
// on localhost; an installed worker must also migrate existing preview caches.
const LOCAL_PREVIEW = ["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname);
const SHELL = [
  "/offline.html",
  "/icons/sparky-192-v2.png",
  "/icons/sparky-512-v2.png",
  "/icons/sparky-maskable-512-v2.png",
  "/icons/apple-touch-icon-v2.png",
];

self.addEventListener("install", (event) => {
  if (!LOCAL_PREVIEW) event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("sparky-") && (LOCAL_PREVIEW || key !== CACHE_NAME)).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (LOCAL_PREVIEW) return;
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/offline.html")) || Response.error()));
    return;
  }
  const publicAsset = url.pathname.startsWith("/_next/static/") || SHELL.includes(url.pathname);
  if (!publicAsset) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && !/private|no-store/i.test(response.headers.get("cache-control") || "")) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
    }
    return response;
  })));
});
