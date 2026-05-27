const CACHE = "dead-drop-v1";
const ASSETS = [
  "/Spyfall/",
  "/Spyfall/index.html",
  "/Spyfall/styles.css",
  "/Spyfall/app.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network-first for Supabase API; cache-first for static assets
self.addEventListener("fetch", e => {
  if (e.request.url.includes("supabase.co") || e.request.url.includes("cdn.jsdelivr")) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
