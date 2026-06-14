import HeapLoader from '@/components/HeapLoader'

// Intentionally a static shell with no server-side DB access: the heap id is
// read client-side from the URL and vocab is loaded IndexedDB-first. This makes
// the rendered output identical for every heap, so the Service Worker can cache
// one shell and serve it for any /heap/* route — the key to offline gameplay.
export default function HeapPage() {
  return <HeapLoader />
}
