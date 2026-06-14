'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { HeapWord } from '@/lib/types'
import { matchesAnswer, matchesEnAnswer } from '@/lib/vocab'

type Mode = 'en-bg' | 'bg-en'
type Phase = 'playing' | 'correct' | 'wrong' | 'cycle-complete'

const BEST_KEY = 'infinite_best_streak'

interface Props {
  words: HeapWord[]
  initialBest: number
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const randomMode = (): Mode => (Math.random() < 0.5 ? 'en-bg' : 'bg-en')

function saveBestLocal(streak: number) {
  try {
    const stored = Number(localStorage.getItem(BEST_KEY)) || 0
    if (streak > stored) localStorage.setItem(BEST_KEY, String(streak))
  } catch { /* ignore */ }
}

export default function InfiniteMode({ words, initialBest }: Props) {
  const router = useRouter()

  const [deck, setDeck] = useState<HeapWord[]>(() => shuffle(words))
  const [pos, setPos] = useState(0)
  const [mode, setMode] = useState<Mode>(() => randomMode())
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>('playing')

  const [streak, setStreak] = useState(0)
  const [bestState, setBestState] = useState(initialBest)
  const [seenCount, setSeenCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [justBeatBest, setJustBeatBest] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const advanceRef = useRef<{ nextPos: number; done: boolean }>({ nextPos: 0, done: false })
  // Mirror live stats into a ref so timeouts / quit handlers read fresh values.
  const statsRef = useRef({ seen: 0, correct: 0, streak: 0 })
  useEffect(() => {
    statsRef.current = { seen: seenCount, correct: correctCount, streak }
  }, [seenCount, correctCount, streak])

  // Derive the displayed best so a late-arriving server best (revalidated after
  // mount) still raises the bar without a state-syncing effect.
  const best = Math.max(bestState, initialBest)

  const word = deck[pos]
  const prompt = mode === 'en-bg' ? word.en : word.bg
  const correctAnswer = mode === 'en-bg' ? word.bg : word.en
  const remaining = deck.length - pos
  const accuracy = seenCount > 0 ? Math.round((correctCount / seenCount) * 100) : 100

  const speak = useCallback((text: string, lang: string) => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = lang
    utt.rate = 0.85
    window.speechSynthesis.speak(utt)
  }, [])

  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  // Persist a finished run: bump best (upward only) + log the attempt.
  const persistResult = useCallback((finalStreak: number, seen: number, correct: number) => {
    saveBestLocal(finalStreak)
    const acc = seen > 0 ? Math.round((correct / seen) * 100) : 100
    fetch('/api/infinite/best-streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streak: finalStreak, words_seen: seen, accuracy: acc }),
    }).catch(() => { /* offline — localStorage already holds the best */ })
  }, [])

  useEffect(() => {
    if (phase === 'playing' && inputRef.current) inputRef.current.focus()
  }, [phase, pos])

  // Auto-speak the Cyrillic prompt in BG→EN mode, like the heap game does.
  useEffect(() => {
    if (phase === 'playing' && mode === 'bg-en') speak(word.bg, 'bg-BG')
  }, [phase, pos, mode, word.bg, speak])

  // Brief celebration after a correct answer, then advance to the next word.
  useEffect(() => {
    if (phase !== 'correct') return
    const timer = setTimeout(() => {
      const { nextPos, done } = advanceRef.current
      if (done) {
        const s = statsRef.current
        persistResult(s.streak, s.seen, s.correct)
        setPhase('cycle-complete')
      } else {
        setPos(nextPos)
        setMode(randomMode())
        setPhase('playing')
      }
    }, 650)
    return () => clearTimeout(timer)
  }, [phase, persistResult])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim() || phase !== 'playing') return

    const isCorrect = mode === 'en-bg'
      ? matchesAnswer(answer, word.bg, word.cyr)
      : matchesEnAnswer(answer, word.en)

    const newSeen = seenCount + 1
    const newCorrect = correctCount + (isCorrect ? 1 : 0)
    setSeenCount(newSeen)
    setCorrectCount(newCorrect)
    setAnswer('')
    vibrate(isCorrect ? 8 : [15, 40, 15])

    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > best) {
        setBestState(newStreak)
        setJustBeatBest(true)
        saveBestLocal(newStreak)
      }
      advanceRef.current = { nextPos: pos + 1, done: pos + 1 >= deck.length }
      setPhase('correct')
    } else {
      // Run ends here — bank the streak we had before the reset.
      persistResult(streak, newSeen, newCorrect)
      setStreak(0)
      setJustBeatBest(false)
      setPhase('wrong')
    }
  }, [answer, phase, mode, word, seenCount, correctCount, streak, best, pos, deck.length, vibrate, persistResult])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit(e as unknown as React.FormEvent)
  }, [handleSubmit])

  // After a wrong answer: keep voyaging from the next word (streak already 0).
  const continueAfterWrong = useCallback(() => {
    const nextPos = pos + 1
    if (nextPos >= deck.length) {
      setPhase('cycle-complete')
    } else {
      setPos(nextPos)
      setMode(randomMode())
      setAnswer('')
      setPhase('playing')
    }
  }, [pos, deck.length])

  // Reshuffle the whole dictionary and sail on — streak & stats carry over.
  const restart = useCallback(() => {
    setDeck(shuffle(words))
    setPos(0)
    setMode(randomMode())
    setAnswer('')
    setPhase('playing')
  }, [words])

  const quit = useCallback(() => {
    const s = statsRef.current
    if (s.streak > 0) persistResult(s.streak, s.seen, s.correct)
    router.push('/map')
  }, [persistResult, router])

  // ── Cycle complete ─────────────────────────────────────────────────────────
  if (phase === 'cycle-complete') {
    return (
      <div className="min-h-full bg-gradient-to-b from-[#1a0b2e] via-indigo-950 to-blue-950 flex flex-col px-4 py-8 gap-5">
        <div className="text-center">
          <div className="text-7xl mb-2 animate-bounce inline-block">🏆</div>
          <div className="flex justify-center gap-2 mb-3 animate-sparkle">
            {['⭐', '✨', '🌟', '✨', '⭐'].map((s, i) => (
              <span key={i} className="text-xl">{s}</span>
            ))}
          </div>
          <h2 className="font-pirata text-4xl text-yellow-300">All Words Mastered!</h2>
          <p className="text-indigo-200 mt-1 text-sm">You sailed the entire dictionary. Shuffle for another lap?</p>
        </div>

        <div className="w-full bg-indigo-950/60 rounded-2xl border border-purple-500/25 p-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-3xl font-bold text-yellow-300">{streak}</p>
            <p className="text-xs text-indigo-300 mt-0.5">🔥 Streak</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-300">{best}</p>
            <p className="text-xs text-indigo-300 mt-0.5">🏅 Best</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-300">{accuracy}%</p>
            <p className="text-xs text-indigo-300 mt-0.5">🎯 Accuracy</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={restart}
            className="w-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl py-4 font-bold text-lg shadow-lg active:scale-95 transition-transform"
          >
            ⚡ Shuffle Again
          </button>
          <button
            onClick={quit}
            className="w-full bg-blue-950/80 text-blue-300 border border-blue-700/30 rounded-2xl py-3 font-semibold text-base active:scale-95 transition-transform"
          >
            🗺️ Back to Map
          </button>
        </div>
      </div>
    )
  }

  const showCorrect = phase === 'correct'
  const showWrong = phase === 'wrong'

  return (
    <div className="min-h-full bg-gradient-to-b from-[#1a0b2e] via-indigo-950 to-blue-950 flex flex-col px-4 py-5 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={quit}
          className="text-indigo-300 text-sm py-2 pr-2 min-h-[44px] flex items-center"
        >
          ← Map
        </button>
        <p className="font-pirata text-xl text-yellow-300 tracking-wide">⚡ Endless Voyage</p>
        <div className="text-right min-w-[44px]">
          <p className="text-[10px] text-indigo-400 uppercase tracking-wider leading-none">Best</p>
          <p className="text-base font-bold text-yellow-300 leading-tight">🏅 {best}</p>
        </div>
      </div>

      {/* Streak counter — the star of the show */}
      <div className="text-center py-2">
        <p className="text-xs text-indigo-300 uppercase tracking-widest mb-1">Current Streak</p>
        <p
          key={streak}
          className={`text-7xl font-bold leading-none ${streak > 0 ? 'text-yellow-300 animate-streak-pop' : 'text-indigo-500'}`}
        >
          {streak}
        </p>
        {justBeatBest && streak > 0 && (
          <p className="text-xs text-purple-300 mt-1 font-semibold animate-sparkle">🏅 New personal best!</p>
        )}
      </div>

      {/* Progress through the shuffle */}
      <div>
        <div className="flex justify-between text-xs text-indigo-400 mb-1">
          <span>🎯 {accuracy}% accuracy</span>
          <span>{remaining} word{remaining !== 1 ? 's' : ''} left in shuffle</span>
        </div>
        <div className="w-full h-2 bg-indigo-950/80 rounded-full overflow-hidden border border-indigo-800/50">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-yellow-400 transition-all duration-300"
            style={{ width: `${(pos / deck.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Prompt card */}
      <div
        className={`w-full rounded-2xl p-6 text-center transition-all border-2 ${
          showCorrect
            ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-400/60 shadow-lg shadow-green-900/30'
            : showWrong
            ? 'bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-400/60 shadow-lg shadow-red-900/30 animate-shake'
            : 'bg-gradient-to-br from-indigo-900/60 to-purple-950/80 border-purple-700/40 shadow-lg shadow-indigo-950/50'
        }`}
      >
        <p className="text-xs text-indigo-300/70 uppercase tracking-widest mb-3">
          {mode === 'en-bg' ? '🗺️ Translate to Bulgarian' : '⚓ Translate to English'}
        </p>
        <p className="text-4xl font-bold text-white mb-1 leading-tight">{prompt}</p>
        {mode === 'bg-en' && (
          <button
            onClick={() => speak(word.bg, 'bg-BG')}
            className="text-2xl mt-2 opacity-50 hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center mx-auto"
            aria-label="Listen"
          >
            🔊
          </button>
        )}

        {showCorrect && (
          <div className="mt-3 animate-sparkle">
            <p className="text-green-300 font-bold text-xl">⚡ Correct!</p>
          </div>
        )}
        {showWrong && (
          <div className="mt-3">
            <p className="text-red-300 font-bold text-lg">✗ Streak broken</p>
            <p className="text-indigo-200 text-sm mt-1.5">
              Answer: <span className="font-bold text-yellow-300 text-base">{correctAnswer}</span>
            </p>
            {mode === 'en-bg' && word.cyr && (
              <p className="text-indigo-400 text-xs mt-0.5">{word.cyr}</p>
            )}
          </div>
        )}
      </div>

      {/* Playing → input; Wrong → try again / quit */}
      {showWrong ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={continueAfterWrong}
            className="w-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl py-4 font-bold text-lg shadow-lg active:scale-95 transition-transform min-h-[56px]"
          >
            ⚡ Try Again
          </button>
          <button
            onClick={quit}
            className="w-full bg-blue-950/80 text-indigo-300 border border-indigo-700/40 rounded-2xl py-3 font-semibold text-base active:scale-95 transition-transform"
          >
            🗺️ Quit to Map
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'en-bg' ? 'Type in Bulgarian (Cyrillic or hlyab)…' : 'Type in English…'}
            enterKeyHint="done"
            disabled={phase !== 'playing'}
            className="w-full bg-indigo-950/80 border-2 border-purple-700/50 text-white placeholder-indigo-500 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:border-yellow-500/50 disabled:opacity-40 min-h-[56px]"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!answer.trim() || phase !== 'playing'}
            className="w-full bg-gradient-to-br from-amber-500 to-yellow-600 text-yellow-900 rounded-2xl py-4 font-bold text-lg shadow-md active:scale-95 transition-transform disabled:opacity-40 min-h-[56px]"
          >
            ⚔️ Submit
          </button>
        </form>
      )}
    </div>
  )
}
