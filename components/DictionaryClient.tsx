'use client'

import { useState, useCallback } from 'react'
import { Volume2 } from 'lucide-react'
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
    <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col px-5 py-6 gap-4 animate-fade-in">
      <div className="pt-4">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Vocabulary</h1>
        <p className="text-sm text-slate-400 mt-1">
          {totalWords > 0 ? `${totalWords} words learned` : 'Complete heaps to add words'}
        </p>
      </div>

      {entries.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search words…"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all duration-200 min-h-[48px]"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      )}

      {entries.length === 0 ? (
        <div className="w-full bg-white/5 rounded-xl border border-white/10 p-6 text-center">
          <p className="text-slate-400 text-sm">
            No words yet. Complete a heap on the map to unlock your first 5 words.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="w-full bg-white/5 rounded-xl border border-white/10 p-6 text-center">
          <p className="text-slate-400 text-sm">No words match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{entry.heap_name}</p>
                  <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    {entry.words.length} words
                  </span>
                </div>
                <p className="text-slate-500 text-xs">
                  {new Date(entry.unlocked_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {entry.words.map((word) => (
                <div
                  key={word.en}
                  className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">{word.en}</span>
                    <button
                      onClick={() => speak(word.en, 'en-US')}
                      className="text-slate-600 hover:text-slate-300 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Speak ${word.en}`}
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-white font-semibold text-sm">{word.bg}</div>
                      {word.cyr && <div className="text-slate-500 text-xs">{word.cyr}</div>}
                    </div>
                    <button
                      onClick={() => speak(word.bg, 'bg-BG')}
                      className="text-slate-600 hover:text-slate-300 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Speak ${word.bg}`}
                    >
                      <Volume2 size={15} />
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
