'use client'

import { useState, useCallback } from 'react'
import type { DictionaryEntry } from '@/lib/types'

interface Props {
  entries: (DictionaryEntry & { heap_name: string })[]
}

export default function DictionaryClient({ entries }: Props) {
  const [search, setSearch] = useState('')

  const speak = useCallback((text: string, lang: string) => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = lang
    utt.rate = 0.85
    window.speechSynthesis.speak(utt)
  }, [])

  const q = search.toLowerCase().trim()

  const filtered = entries
    .map(entry => ({
      ...entry,
      words: entry.words.filter(w =>
        !q ||
        w.en.toLowerCase().includes(q) ||
        w.bg.toLowerCase().includes(q) ||
        (w.cyr ?? '').toLowerCase().includes(q)
      ),
    }))
    .filter(entry => entry.words.length > 0)

  const totalWords = entries.reduce((sum, e) => sum + e.words.length, 0)

  return (
    <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 flex flex-col px-4 py-6 gap-4">
      <div className="text-center">
        <div className="text-5xl mb-2 animate-float inline-block">💰</div>
        <h1 className="font-pirata text-4xl text-yellow-300 tracking-wide">Treasure Chest</h1>
        <p className="text-sm text-blue-300 mt-1">
          {totalWords > 0 ? `${totalWords} words plundered` : 'Complete heaps to add words'}
        </p>
      </div>

      {entries.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your plunder…"
          className="w-full bg-blue-950/70 border-2 border-blue-700/40 text-white placeholder-blue-600 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500/40 min-h-[48px]"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      )}

      {entries.length === 0 ? (
        <div className="w-full bg-blue-900/40 rounded-2xl border border-blue-700/30 p-6 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-blue-300 text-sm">
            No treasure yet. Complete a heap on the Map to unlock your first 5 words!
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="w-full bg-blue-900/40 rounded-2xl border border-blue-700/30 p-6 text-center">
          <p className="text-blue-400 text-sm">No words match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-blue-950/60 rounded-2xl border border-blue-700/30 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600/70 to-yellow-700/70 px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 font-semibold text-sm">{entry.heap_name}</p>
                  <p className="text-yellow-300/60 text-xs">{entry.words.length} words</p>
                </div>
                <p className="text-yellow-400/60 text-xs">
                  {new Date(entry.unlocked_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {entry.words.map((word) => (
                <div
                  key={word.en}
                  className="flex items-center justify-between px-4 py-3 border-b border-blue-800/40 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-blue-200 text-sm font-medium">{word.en}</span>
                    <button
                      onClick={() => speak(word.en, 'en-US')}
                      className="text-base opacity-40 hover:opacity-80 transition-opacity leading-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Speak ${word.en}`}
                    >
                      🔊
                    </button>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-yellow-300 font-bold text-sm">{word.bg}</div>
                      {word.cyr && <div className="text-blue-500 text-xs">{word.cyr}</div>}
                    </div>
                    <button
                      onClick={() => speak(word.bg, 'bg-BG')}
                      className="text-base opacity-40 hover:opacity-80 transition-opacity leading-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Speak ${word.bg}`}
                    >
                      🔊
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
