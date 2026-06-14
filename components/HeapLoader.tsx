'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import HeapGame from './HeapGame'
import type { Heap, UserProgress } from '@/lib/types'

interface HeapData {
  heap: Heap
  progress: UserProgress | null
  nextHeapId: string | null
}

type Status = 'loading' | 'ready' | 'missing'

// Client-side data loader for a heap. Reads the heap id straight from the URL
// (so the server-rendered shell is identical for every heap and can be cached
// once for all of them), then loads vocab IndexedDB-first with a network
// revalidate. This is what makes a never-before-visited heap playable offline.
export default function HeapLoader() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const router = useRouter()
  const [data, setData] = useState<HeapData | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      // 1) Instant: hydrate from the offline cache if we have it.
      try {
        const { getCachedHeap } = await import('@/lib/idb')
        const cached = await getCachedHeap(id)
        if (cached && !cancelled) {
          console.log(`[heap] loaded "${id}" from IndexedDB cache`)
          if (!cached.unlocked) {
            router.replace('/map')
            return
          }
          setData({ heap: cached.heap, progress: cached.progress, nextHeapId: cached.nextHeapId })
          setStatus('ready')
        }
      } catch (err) {
        console.warn('[heap] IndexedDB read failed', err)
      }

      // 2) Revalidate from the network (also recovers when there was no cache).
      try {
        const res = await fetch(`/api/heaps/${id}`)
        if (!res.ok) throw new Error(`status ${res.status}`)
        const json = await res.json() as {
          heap: Heap
          progress: UserProgress | null
          unlocked: boolean
          nextHeapId: string | null
        }
        if (cancelled) return
        if (!json.unlocked) {
          router.replace('/map')
          return
        }
        console.log(`[heap] refreshed "${id}" from network`)
        setData({ heap: json.heap, progress: json.progress, nextHeapId: json.nextHeapId })
        setStatus('ready')

        // Keep the offline cache warm for this heap.
        try {
          const { seedHeaps } = await import('@/lib/idb')
          await seedHeaps([{
            id,
            heap: json.heap,
            progress: json.progress,
            nextHeapId: json.nextHeapId,
            unlocked: json.unlocked,
            cachedAt: Date.now(),
          }])
        } catch { /* non-fatal */ }
      } catch (err) {
        console.warn(`[heap] network load for "${id}" failed (offline?)`, err)
        // If we never got data from cache either, show the offline-missing state.
        if (!cancelled) setStatus(prev => (prev === 'ready' ? prev : 'missing'))
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, router])

  if (status === 'ready' && data) {
    return <HeapGame heap={data.heap} progress={data.progress} nextHeapId={data.nextHeapId} />
  }

  if (status === 'missing') {
    return (
      <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 flex flex-col items-center justify-center px-8 py-12 gap-5 text-center">
        <div className="text-6xl animate-float inline-block">🧭</div>
        <h1 className="font-pirata text-3xl text-yellow-300">Uncharted Waters</h1>
        <p className="text-blue-300 text-sm max-w-xs">
          This island hasn&apos;t been downloaded yet. Connect to the internet once
          to chart it, and it&apos;ll be playable offline forever after.
        </p>
        <button
          onClick={() => router.push('/map')}
          className="w-full max-w-xs bg-gradient-to-br from-amber-500 to-yellow-600 text-yellow-900 rounded-2xl py-4 font-bold text-lg shadow-lg active:scale-95 transition-transform"
        >
          🗺️ Back to Map
        </button>
      </div>
    )
  }

  // Loading
  return (
    <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 flex flex-col items-center justify-center px-8 gap-4">
      <div className="text-5xl animate-float inline-block">⚓</div>
      <p className="text-blue-300 text-sm animate-pulse">Charting the island…</p>
    </div>
  )
}
