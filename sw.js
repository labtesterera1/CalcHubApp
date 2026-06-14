/* ============================================================
   CalcHubApp — Service Worker  v3.0
   Cache-first for assets, network-first for navigation
   v3.0: bump forces old broken cache to be cleared on next load
   ============================================================ */

const CACHE_NAME = 'calchubapp-v3.0';

const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './modules/registry.js',
  './modules/storage.js',
  './modules/psm.js',
  './modules/vault.js',
  './modules/unit-converter.js',
  './modules/scorecard.js',
  './modules/loan-emi.js',
  './modules/date-age.js',
  './modules/time-converter.js',
];

/* ── Install: pre-cache all app shell files ── */
self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(new Request(url, { cache: 'reload' }))
            .catch(e => console.warn('[SW] Failed to cache:', url, e))
        )
      );
    })
  );
});

/* ── Activate: wipe all old caches ── */
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch strategy:
      JS/CSS/HTML modules → cache-first (fast, offline works)
      Navigation (index.html) → network-first with cache fallback
      Everything else → network only
   ── */
self.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url);

  // Skip non-GET and cross-origin (fonts etc)
  if (evt.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // App shell files → cache first, update cache in background
  const isShellFile = STATIC_ASSETS.some(a => url.pathname.endsWith(a.replace('./', '/')));
  const isRoot      = url.pathname === '/' || url.pathname.endsWith('/index.html');

  if (isRoot) {
    // Network-first for main page (get latest)
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(evt.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (isShellFile) {
    // Cache-first for modules
    evt.respondWith(
      caches.match(evt.request).then(cached => {
        const networkFetch = fetch(evt.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(evt.request, res.clone()));
          }
          return res;
        });
        return cached || networkFetch;
      })
    );
    return;
  }
});

/* ── Message: force cache update ── */
self.addEventListener('message', evt => {
  if (evt.data === 'SKIP_WAITING') self.skipWaiting();
  if (evt.data === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
