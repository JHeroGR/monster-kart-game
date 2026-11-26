/* Offline support. `npm run build` replaces VERSION and PRECACHE below, so a built copy works with no network after the first visit.
   While developing (VERSION stays 'dev') this worker does nothing, so you always see your latest edits. */
const VERSION = 'dev';
const PRECACHE = [];
const CACHE = 'monster-kart-' + VERSION;

self.addEventListener('install', event => {
  if (VERSION === 'dev') { self.skipWaiting(); return; }
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('monster-kart-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (VERSION === 'dev' || req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;      // fonts and anything else cross-origin go straight to the network
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    const refresh = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
    if (hit) { event.waitUntil(refresh.catch(() => {})); return hit; }     // cache first, refresh quietly for next time
    try { return await refresh; }
    catch (err) {
      if (req.mode === 'navigate') { const home = await cache.match(new URL('./', self.registration.scope).href); if (home) return home; }
      throw err;
    }
  })());
});
