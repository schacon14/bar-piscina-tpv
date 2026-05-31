/* Bar Piscina TPV · Service Worker
   Estrategia: cache-first para el "app shell" con actualización en segundo plano.
   Esto permite abrir y usar la app sin conexión. */

const CACHE = 'barpiscina-v9'
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=11',
  './app.js?v=11',
  './manifest.json',
  './icon.svg',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return

  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(req, copy))
        }
        return res
      }).catch(() => cached)
      return cached || network
    })
  )
})
