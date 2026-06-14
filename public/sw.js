const CACHE_VERSION = 'v3'
const STATIC_CACHE = `bulgeasy-static-${CACHE_VERSION}`
const PAGE_CACHE = `bulgeasy-pages-${CACHE_VERSION}`
const API_CACHE = `bulgeasy-api-${CACHE_VERSION}`
const ALL_CACHES = [STATIC_CACHE, PAGE_CACHE, API_CACHE]

const OFFLINE_URL = '/offline.html'

// Canonical keys for the (identical-for-every-id) heap page shell. Because the
// heap page is a static client shell that reads its id from the URL, one cached
// response is valid for ALL /heap/* routes — including ones never visited.
const HEAP_RSC_SHELL = '/__heap_shell__?rsc=1'
const HEAP_HTML_SHELL = '/__heap_shell__?html=1'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.add(OFFLINE_URL))
      .catch(() => {})
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

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) return cached

  const response = await fetchPromise
  if (response) return response
  return (await caches.match(OFFLINE_URL)) ??
    new Response('<h1>Offline</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } })
}

function isHeapPage(url) {
  return /^\/heap\/[^/]+\/?$/.test(url.pathname)
}

// Heap pages share one shell. Cache the exact request AND the canonical shell
// key, then serve the shell for any /heap/* miss so unvisited heaps load offline.
async function heapShell(request, isRSC) {
  const cache = await caches.open(PAGE_CACHE)
  const shellKey = isRSC ? HEAP_RSC_SHELL : HEAP_HTML_SHELL

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
      cache.put(shellKey, response.clone())
    }
    return response
  } catch {
    const exact = await cache.match(request)
    if (exact) return exact
    // ignoreVary: the shell is identical regardless of RSC/router headers.
    const shell = await cache.match(shellKey, { ignoreVary: true })
    if (shell) {
      console.log('[sw] serving heap shell for', request.url)
      return shell
    }
    // Never cached any heap shell — fall back to the offline page (HTML) so the
    // router does a hard navigation instead of crashing on an unparsable RSC.
    return (await caches.match(OFFLINE_URL)) ??
      new Response('<h1>Offline</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } })
  }
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

  // Heap pages (RSC navigation, link prefetch, or full HTML) → shared shell.
  // Handled before the generic RSC/prefetch branches so every /heap/* — even
  // prefetched but unvisited ones — populates and reuses the canonical shell.
  if (isHeapPage(url)) {
    const isRSC = request.headers.get('RSC') === '1'
    event.respondWith(heapShell(request, isRSC))
    return
  }

  // RSC client-side navigation requests → network-first so they get cached.
  if (request.headers.get('RSC') === '1') {
    event.respondWith(networkFirst(request, PAGE_CACHE))
    return
  }

  // Next.js prefetch hints (non-heap) → skip; not needed for offline
  if (request.headers.get('Next-Router-Prefetch')) return

  // HTML navigations → stale-while-revalidate with offline page fallback
  const accept = request.headers.get('Accept') ?? ''
  if (accept.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE))
  }
})
