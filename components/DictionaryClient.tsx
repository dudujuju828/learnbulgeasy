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
    <div className="flex flex-col px-4 py-6 gap-4">
      <div className="text-center">
        <div className="text-5xl mb-2">📖</div>
        <h1 className="text-2xl font-bold text-blue-900">Your Dictionary</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalWords > 0 ? `${totalWords} words unlocked` : 'Complete heaps to add words'}
        </p>
      </div>

      {entries.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search words…"
          className="w-full border-2 border-blue-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 bg-white"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      )}

      {entries.length === 0 ? (
        <div className="w-full bg-white rounded-2xl shadow-md p-6 text-center border border-blue-100">
          <p className="text-gray-400 text-sm">
            No words yet. Complete a heap on the Map to unlock your first 5 words!
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="w-full bg-white rounded-2xl shadow-md p-6 text-center border border-blue-100">
          <p className="text-gray-400 text-sm">No words match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="bg-blue-900 px-4 py-2 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{entry.heap_name}</p>
                  <p className="text-blue-300 text-xs">{entry.words.length} words</p>
                </div>
                <p className="text-blue-400 text-xs">
                  {new Date(entry.unlocked_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {entry.words.map((word) => (
                <div
                  key={word.en}
                  className="flex items-center justify-between px-4 py-3 border-b border-blue-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 text-sm font-medium">{word.en}</span>
                    <button
                      onClick={() => speak(word.en, 'en-US')}
                      className="text-base opacity-40 hover:opacity-80 transition-opacity leading-none"
                      aria-label={`Speak ${word.en}`}
                    >
                      🔊
                    </button>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-blue-800 font-bold text-sm">{word.bg}</div>
                      {word.cyr && <div className="text-gray-400 text-xs">{word.cyr}</div>}
                    </div>
                    <button
                      onClick={() => speak(word.bg, 'bg-BG')}
                      className="text-base opacity-40 hover:opacity-80 transition-opacity leading-none"
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
