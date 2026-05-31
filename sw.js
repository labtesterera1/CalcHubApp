/* ============================================================
   CalcHubApp — Service Worker  v1.0.0
   Warm-black / lime-accent offline-first PWA
   ============================================================ */

const CACHE_NAME   = 'calchubapp-v1.0.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './modules/psm.js',
  './modules/vault.js',
  './modules/unit-converter.js',
  './modules/scorecard.js',
  './modules/loan-emi.js',
  './modules/date-age.js',
  './modules/time-converter.js',
  './modules/registry.js',
  './modules/storage.js',
  './modules/ui.js',
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
];

/* ── Install: cache all shell assets ── */
self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ASSETS.map(url => {
        return new Request(url, { mode: url.startsWith('http') ? 'cors' : 'same-origin' });
      })).catch(() => {/* fonts may fail offline, ok */})
    )
  );
});

/* ── Activate: delete old caches ── */
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: network-first with cache fallback ── */
self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;

  evt.respondWith(
    fetch(evt.request)
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(evt.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(evt.request))
  );
});

/* ── Background sync stub (future) ── */
self.addEventListener('sync', evt => {
  if (evt.tag === 'calchub-sync') {
    console.log('[CalcHub SW] Background sync triggered');
  }
});
