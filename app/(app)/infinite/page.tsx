import InfiniteLoader from '@/components/InfiniteLoader'

// Static client shell (no server-side DB access): the dictionary is loaded
// IndexedDB-first on the client, so the Service Worker can cache this one page
// and Infinite Mode stays playable offline.
export default function InfinitePage() {
  return <InfiniteLoader />
}
