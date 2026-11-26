// Le Cercle 127 — service worker de l'app web (portée /app/).
// Fichiers versionnés (/_expo/static, images, polices) : depuis le cache, téléchargés une seule fois.
// Pages de l'app : réseau d'abord, la dernière version gardée sert hors connexion.
// Les données (API du site, paiement) ne passent jamais par le cache.
const CACHE = 'c127-app-v1';
const SHELL = '/app/';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('c127-app-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/app/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL)),
    );
    return;
  }

  if (/^\/app\/(_expo\/static|assets|icons)\//.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((cache) => cache.put(req, copy)); }
        return res;
      })),
    );
  }
});
