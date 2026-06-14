'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import InfiniteMode from './InfiniteMode'
import type { HeapWord } from '@/lib/types'

type Status = 'loading' | 'ready' | 'empty'

const BEST_KEY = 'infinite_best_streak'

// Client-side loader for Infinite Mode. Reads the dictionary IndexedDB-first
// (derived from completed cached heaps) with a network revalidate, mirroring
// HeapLoader so a previously-visited player can drill words fully offline.
export default function InfiniteLoader() {
  const router = useRouter()
  const [words, setWords] = useState<HeapWord[] | null>(null)
  const [best, setBest] = useState<number>(() => {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 }
  })
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let cancelled = false

    async function load() {
      // 1) Instant: derive the dictionary from the offline heap cache.
      try {
        const { getDictionaryWords } = await import('@/lib/idb')
        const cached = await getDictionaryWords()
        if (cached.length && !cancelled) {
          setWords(cached)
          setStatus('ready')
        }
      } catch (err) {
        console.warn('[infinite] IndexedDB read failed', err)
      }

      // 2) Revalidate from the network (also recovers when there was no cache).
      try {
        const res = await fetch('/api/infinite/start')
        if (!res.ok) throw new Error(`status ${res.status}`)
        const json = await res.json() as { words: HeapWord[]; best_streak: number }
        if (cancelled) return
        if (typeof json.best_streak === 'number') {
          setBest(b => Math.max(b, json.best_streak))
        }
        if (json.words?.length) {
          setWords(json.words)
          setStatus('ready')
        } else {
          // No unlocked words server-side — only fall to empty if cache was empty too.
          setStatus(prev => (prev === 'ready' ? prev : 'empty'))
        }
      } catch (err) {
        console.warn('[infinite] network load failed (offline?)', err)
        if (!cancelled) setStatus(prev => (prev === 'ready' ? prev : 'empty'))
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  if (status === 'ready' && words) {
    return <InfiniteMode words={words} initialBest={best} />
  }

  if (status === 'empty') {
    return (
      <div className="min-h-full bg-gradient-to-b from-[#1a0b2e] via-indigo-950 to-blue-950 flex flex-col items-center justify-center px-8 py-12 gap-5 text-center">
        <div className="text-6xl animate-float inline-block">⚡</div>
        <h1 className="font-pirata text-3xl text-yellow-300">No Treasure Yet</h1>
        <p className="text-indigo-200 text-sm max-w-xs">
          Conquer at least one island to fill your dictionary — then return here
          to drill your words and chase an endless streak.
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
    <div className="min-h-full bg-gradient-to-b from-[#1a0b2e] via-indigo-950 to-blue-950 flex flex-col items-center justify-center px-8 gap-4">
      <div className="text-5xl animate-float inline-block">⚡</div>
      <p className="text-indigo-200 text-sm animate-pulse">Shuffling your treasure…</p>
    </div>
  )
}
