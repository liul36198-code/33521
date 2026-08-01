// Service Worker — iOS17 聊天室 v3 PWA
const CACHE_NAME = "chatroom-v3-2026";
const ASSETS = [
 "./",
 "./index.html",
 "./chatroom-v3-enhanced.html",
 "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600&display=swap"
];

// 安装：缓存核心资源
self.addEventListener("install", e => {
 e.waitUntil(
 caches.open(CACHE_NAME).then(cache => {
 return cache.addAll(ASSETS).catch(err => console.warn("缓存部分失败:", err));
 }).then(() => self.skipWaiting())
 );
});

// 激活：清理旧缓存
self.addEventListener("activate", e => {
 e.waitUntil(
 caches.keys().then(keys =>
 Promise.all(
 keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
 )
 ).then(() => self.clients.claim())
 );
});

// 请求拦截：缓存优先，网络更新
self.addEventListener("fetch", e => {
 // 仅处理 GET 请求，跳过 WebSocket 和跨域
 if(e.request.method !== "GET") return;
 const url = new URL(e.request.url);
 if(url.protocol === "ws:" || url.protocol === "wss:") return;
 if(url.origin !== location.origin && !url.href.includes("fonts.googleapis.com")) return;

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

// 推送通知（后台消息）
self.addEventListener("push", e => {
 if(!e.data) return;
 try {
 const data = e.data.json();
 const options = {
 body: data.body || "收到新消息",
 icon: "./icon-192.png",
 badge: "./badge-72.png",
 tag: "chatroom-msg",
 renotify: true,
 requireInteraction: false,
 vibrate: [200, 100, 200],
 data: { url: data.url || "/" }
 };
 e.waitUntil(self.registration.showNotification(data.title || "💬 聊天室", options));
 } catch(err) {
 console.warn("推送解析失败:", err);
 }
});

// 通知点击
self.addEventListener("notificationclick", e => {
 e.notification.close();
 e.waitUntil(
 clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
 if(clientList.length > 0) {
 return clientList[0].focus();
 }
 return clients.openWindow(e.notification.data?.url || "/");
 })
 );
});

// 后台同步消息（网络恢复时同步）
self.addEventListener("sync", e => {
 if(e.tag === "chat-sync") {
 e.waitUntil(syncMessages());
 }
});

async function syncMessages() {
 // 可在此扩展：网络恢复后从服务器拉取离线消息
 console.log("后台同步触发");
}
