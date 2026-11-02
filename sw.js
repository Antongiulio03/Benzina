// Rifornimenti – funziona anche senza connessione
const CACHE = 'rifornimenti-v4';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // rete se veloce (per ricevere gli aggiornamenti), altrimenti la copia salvata
    const net = fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return res;
    });
    const timeout = new Promise(r => setTimeout(r, 2500));
    e.respondWith(Promise.race([net, timeout]).then(res => res || caches.match('./index.html'))
      .catch(() => caches.match('./index.html')).then(res => res || net));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
