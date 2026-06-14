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
      <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center px-8 py-12 gap-5 text-center animate-fade-in">
        <h1 className="text-xl font-semibold text-white">No words yet</h1>
        <p className="text-slate-400 text-sm max-w-xs">
          Complete at least one heap to fill your vocabulary, then come back to
          drill your words and chase an endless streak.
        </p>
        <button
          onClick={() => router.push('/map')}
          className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-3.5 font-medium text-base transition-all duration-200"
        >
          Back to map
        </button>
      </div>
    )
  }

  // Loading
  return (
    <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center px-8 gap-4">
      <p className="text-slate-400 text-sm animate-pulse">Loading your words…</p>
    </div>
  )
}
