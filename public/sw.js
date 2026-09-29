const CACHE_NAME = "sparky-public-v14";
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
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("sparky-") && (LOCAL_PREVIEW || key !== CACHE_NAME)).map((key) => caches.delete(key)))).then(() => self.clients.claim()).then(async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      windows.forEach(client => client.postMessage({ type: "SPARKY_RELEASE_READY", cacheVersion: CACHE_NAME }));
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (LOCAL_PREVIEW) return;
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(async () => (await caches.match("/offline.html")) || Response.error()));
    return;
  }
  const publicAsset = SHELL.includes(url.pathname);
  if (!publicAsset) return;
  event.respondWith(fetch(request, { cache: 'no-store' }).then((response) => {
    if (response.ok && !/private|no-store/i.test(response.headers.get("cache-control") || "")) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
    }
    return response;
  }).catch(async () => (await caches.match(request)) || Response.error()));
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch { /* Keep a useful fallback. */ }
  const title = typeof payload.title === 'string' ? payload.title.slice(0, 100) : 'Sparky English';
  const body = typeof payload.body === 'string' ? payload.body.slice(0, 180) : 'Hora de praticar inglês.';
  const url = typeof payload.url === 'string' && payload.url.startsWith('/') && !payload.url.startsWith('//') ? payload.url : '/';
  const notificationId = typeof payload.notificationId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(payload.notificationId) ? payload.notificationId : null;
  const artwork = {
    review: '/notifications/review.webp',
    resume: '/notifications/resume.webp',
    'daily-goal': '/notifications/daily-goal.webp',
  };
  const image = Object.hasOwn(artwork, payload.kind) ? artwork[payload.kind] : '/icons/sparky-192-v2.png';
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: image,
    image,
    badge: '/icons/sparky-192-v2.png',
    tag: notificationId ? 'sparky-notification-' + notificationId : 'sparky-study-reminder',
    data: { url, notificationId },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin);
  const url = target.origin === self.location.origin ? target.href : self.location.origin + '/';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      const id = event.notification.data?.notificationId;
      if (id) {
        // The app acknowledges immediately, even before login. Its lesson modal
        // and checkpoint remain intact. Older app versions fall back to navigation.
        const handled = await new Promise(resolve => {
          const channel = new MessageChannel();
          const timer = setTimeout(() => { channel.port1.close(); resolve(false); }, 1500);
          channel.port1.onmessage = message => { clearTimeout(timer); channel.port1.close(); resolve(message.data?.handled === true); };
          existing.postMessage({ type: 'SPARKY_NOTIFICATION_CLICK', notificationId: id }, [channel.port2]);
        });
        if (handled) return;
      }
      if (existing.url !== url) await existing.navigate(url);
    }
    else await self.clients.openWindow(url);
  })());
});
