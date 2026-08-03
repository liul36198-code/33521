// Service Worker — NetworkFirst PWA (no caching issues)
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => {
 e.waitUntil(
 caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
 .then(() => self.clients.claim())
 );
});
self.addEventListener("fetch", e => {
 const url = new URL(e.request.url);
 if(url.protocol === "ws:" || url.protocol === "wss:") return;
 // 不缓存任何东西，全部走网络
 e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
