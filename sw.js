// Service Worker — iOS17 聊天室 v3 PWA
const CACHE_NAME = "chatroom-v3-2026-final";
const ASSETS = [
 "./",
 "./index.html",
 "./manifest.json",
 "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600&display=swap"
];

self.addEventListener("install", e => {
 e.waitUntil(
 caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(err => console.warn("缓存部分失败:", err)))
 .then(() => self.skipWaiting())
 );
});

self.addEventListener("activate", e => {
 e.waitUntil(
 caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
 .then(() => self.clients.claim())
 );
});

self.addEventListener("fetch", e => {
 if(e.request.method !== "GET") return;
 const url = new URL(e.request.url);
 if(url.protocol === "ws:" || url.protocol === "wss:") return;
 if(url.origin !== location.origin && !url.href.includes("fonts.googleapis")) return;
 e.respondWith(
 caches.match(e.request).then(cached => {
 const fetchPromise = fetch(e.request).then(res => {
 if(res && res.status === 200) {
 const clone = res.clone();
 caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
 }
 return res;
 }).catch(() => cached);
 return cached || fetchPromise;
 })
 );
});

self.addEventListener("push", e => {
 if(!e.data) return;
 try {
 const data = e.data.json();
 const options = {
 body: data.body || "收到新消息",
 icon: "./manifest.json",
 badge: "./manifest.json",
 tag: "chatroom-msg",
 renotify: true,
 data: { url: data.url || "/" }
 };
 e.waitUntil(self.registration.showNotification(data.title || "💬 聊天室", options));
 } catch(err) {}
});

self.addEventListener("notificationclick", e => {
 e.notification.close();
 e.waitUntil(
 clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
 if(clientList.length > 0) return clientList[0].focus();
 return clients.openWindow(e.notification.data?.url || "/");
 })
 );
});
