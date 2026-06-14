const CACHE_VERSION = 'v2'
const STATIC_CACHE = `bulgeasy-static-${CACHE_VERSION}`
const PAGE_CACHE = `bulgeasy-pages-${CACHE_VERSION}`
const API_CACHE = `bulgeasy-api-${CACHE_VERSION}`
const ALL_CACHES = [STATIC_CACHE, PAGE_CACHE, API_CACHE]

const OFFLINE_URL = '/offline.html'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(cache =>
    cache.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone())
        return response
      })
    })
  )
}

function networkFirst(request, cacheName) {
  return fetch(request)
    .then(response => {
      if (response.ok) {
        caches.open(cacheName).then(cache => cache.put(request, response.clone()))
      }
      return response
    })
    .catch(() =>
      caches.open(cacheName).then(cache =>
        cache.match(request).then(cached => cached ?? new Response('{"error":"offline"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }))
      )
    )
}

// Serves cached immediately, revalidates in background.
// If no cache and network fails, returns the pre-cached offline page instead of rejecting.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  // Start background fetch — resolve to null instead of rejecting when offline
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  // Cache hit: return immediately; revalidation runs in background
  if (cached) return cached

  // Cache miss: wait for network or fall back to offline page
  const response = await fetchPromise
  if (response) return response
  return (await caches.match(OFFLINE_URL)) ??
    new Response('<h1>Offline</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } })
}

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Immutable Next.js static chunks → cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // API routes → network-first with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // Public static assets → cache-first
  if (/\.(svg|png|ico|jpg|jpeg|webp|woff2?|ttf|eot|json)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // RSC client-side navigation requests → network-first so they get cached.
  // A 503 fallback is better than letting the raw network error bubble up and
  // potentially trigger a hard navigation that crashes with "site can't be reached".
  if (request.headers.get('RSC') === '1') {
    event.respondWith(networkFirst(request, PAGE_CACHE))
    return
  }

  // Next.js prefetch hints → skip; not needed for offline
  if (request.headers.get('Next-Router-Prefetch')) return

  // HTML navigations → stale-while-revalidate with offline page fallback
  const accept = request.headers.get('Accept') ?? ''
  if (accept.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE))
  }
})
