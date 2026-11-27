// Офлайн-режим: приложение открывается без интернета после первого запуска.
const CACHE = "atehno-scanner-v7";
const FILES = ["./", "./index.html", "./manifest.json", "./lib/xlsx.full.min.js", "./lib/zxing.min.js", "./lib/JsBarcode.all.min.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// сначала сеть (чтобы получать обновления), при отсутствии интернета — кэш
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).pathname.includes("/data/")) return;   // база: приложение хранит её само, в кэш не кладём
  const same = new URL(e.request.url).origin === location.origin;
  // своё приложение всегда сверяем с сервером (иначе браузер до 10 минут отдаёт старую версию)
  const req = same ? fetch(e.request.url, {cache: "no-cache", credentials: "same-origin"}) : fetch(e.request);
  e.respondWith(
    req.then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("./index.html")))
  );
});
