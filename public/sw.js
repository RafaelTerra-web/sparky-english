const CACHE_NAME = "sparky-public-v5";
const SHELL = [
  "/offline.html",
  "/visuals/sparky-panda.png",
  "/icons/sparky-192-v2.png",
  "/icons/sparky-512-v2.png",
  "/icons/sparky-maskable-512-v2.png",
  "/icons/apple-touch-icon-v2.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("sparky-") && key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/offline.html")) || Response.error()));
    return;
  }
  const publicAsset = url.pathname.startsWith("/_next/static/") || SHELL.includes(url.pathname)
    || (url.pathname === "/_next/image" && url.searchParams.get("url") === "/visuals/sparky-panda.png");
  if (!publicAsset) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && !/private|no-store/i.test(response.headers.get("cache-control") || "")) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
    }
    return response;
  })));
});
