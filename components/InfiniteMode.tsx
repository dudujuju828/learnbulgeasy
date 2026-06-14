'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Volume2, Check, X, Zap } from 'lucide-react'
import type { HeapWord } from '@/lib/types'
import { matchesAnswer, matchesEnAnswer } from '@/lib/vocab'

type Mode = 'en-bg' | 'bg-en'
type Direction = 'mixed' | 'en-bg' | 'bg-en'
type Phase = 'playing' | 'correct' | 'wrong' | 'cycle-complete'

const BEST_KEY = 'infinite_best_streak'

interface Props {
  words: HeapWord[]
  initialBest: number
  direction?: Direction
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

// Resolve the next prompt mode: a fixed direction is honored verbatim; "mixed"
// randomizes EN↔BG per word (the original behaviour).
const modeFor = (direction: Direction): Mode =>
  direction === 'mixed' ? randomMode() : direction

function saveBestLocal(streak: number) {
  try {
    const stored = Number(localStorage.getItem(BEST_KEY)) || 0
    if (streak > stored) localStorage.setItem(BEST_KEY, String(streak))
  } catch { /* ignore */ }
}

export default function InfiniteMode({ words, initialBest, direction = 'mixed' }: Props) {
  const router = useRouter()

  const [deck, setDeck] = useState<HeapWord[]>(() => shuffle(words))
  const [pos, setPos] = useState(0)
  const [mode, setMode] = useState<Mode>(() => modeFor(direction))
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
        setMode(modeFor(direction))
        setPhase('playing')
      }
    }, 650)
    return () => clearTimeout(timer)
  }, [phase, persistResult, direction])

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
      setMode(modeFor(direction))
      setAnswer('')
      setPhase('playing')
    }
  }, [pos, deck.length, direction])

  // Reshuffle the whole dictionary and sail on — streak & stats carry over.
  const restart = useCallback(() => {
    setDeck(shuffle(words))
    setPos(0)
    setMode(modeFor(direction))
    setAnswer('')
    setPhase('playing')
  }, [words, direction])

  const quit = useCallback(() => {
    const s = statsRef.current
    if (s.streak > 0) persistResult(s.streak, s.seen, s.correct)
    router.push('/map')
  }, [persistResult, router])

  // ── Cycle complete ─────────────────────────────────────────────────────────
  if (phase === 'cycle-complete') {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col px-5 py-8 gap-5 animate-fade-in">
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/15 text-violet-400 mb-4 animate-scale-in">
            <Check size={32} strokeWidth={2.5} />
          </span>
          <h2 className="text-2xl font-semibold text-white">All words cleared</h2>
          <p className="text-slate-400 mt-1 text-sm">You ran through the whole dictionary. Shuffle for another lap?</p>
        </div>

        <div className="w-full bg-white/5 rounded-xl border border-white/10 p-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-semibold text-violet-400">{streak}</p>
            <p className="text-xs text-slate-500 mt-0.5">Streak</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-violet-400">{best}</p>
            <p className="text-xs text-slate-500 mt-0.5">Best</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-violet-400">{accuracy}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Accuracy</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={restart}
            className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-lg py-3.5 font-medium text-base transition-all duration-200"
          >
            Shuffle again
          </button>
          <button
            onClick={quit}
            className="w-full text-slate-400 hover:text-white rounded-lg py-3 font-medium text-sm transition-all duration-200"
          >
            Back to map
          </button>
        </div>
      </div>
    )
  }

  const showCorrect = phase === 'correct'
  const showWrong = phase === 'wrong'

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col px-5 py-5 gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={quit}
          className="flex items-center gap-1 text-slate-400 hover:text-white text-sm py-2 pr-2 min-h-[44px] transition-colors duration-200"
        >
          <ArrowLeft size={16} /> Map
        </button>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <Zap size={16} className="text-violet-400" /> Infinite Mode
        </p>
        <div className="text-right min-w-[44px]">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider leading-none">Best</p>
          <p className="text-base font-semibold text-violet-400 leading-tight">{best}</p>
        </div>
      </div>

      {/* Streak counter — the focal point */}
      <div className="text-center py-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current streak</p>
        <p
          key={streak}
          className={`text-7xl font-semibold leading-none ${streak > 0 ? 'text-violet-400 animate-streak-pop' : 'text-slate-600'}`}
        >
          {streak}
        </p>
        {justBeatBest && streak > 0 && (
          <p className="text-xs text-violet-300 mt-2 font-medium animate-fade-in">New personal best</p>
        )}
      </div>

      {/* Progress through the shuffle */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{accuracy}% accuracy</span>
          <span>{remaining} word{remaining !== 1 ? 's' : ''} left</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 transition-all duration-300"
            style={{ width: `${(pos / deck.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Prompt card */}
      <div
        className={`w-full rounded-xl p-6 text-center transition-all duration-200 border ${
          showCorrect
            ? 'bg-emerald-500/10 border-emerald-500/40'
            : showWrong
            ? 'bg-red-500/10 border-red-500/40'
            : 'bg-white/5 border-white/10'
        }`}
      >
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          {mode === 'en-bg' ? 'Translate to Bulgarian' : 'Translate to English'}
        </p>
        <p className="text-4xl font-semibold text-white mb-1 leading-tight">{prompt}</p>
        {mode === 'bg-en' && (
          <button
            onClick={() => speak(word.bg, 'bg-BG')}
            className="text-slate-400 hover:text-white transition-colors duration-200 mt-3 min-h-[44px] min-w-[44px] flex items-center justify-center mx-auto"
            aria-label="Listen"
          >
            <Volume2 size={22} />
          </button>
        )}

        {showCorrect && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-emerald-400 font-medium animate-fade-in">
            <Check size={18} strokeWidth={2.5} /> Correct
          </div>
        )}
        {showWrong && (
          <div className="mt-3 animate-fade-in">
            <p className="flex items-center justify-center gap-1.5 text-red-400 font-medium">
              <X size={18} strokeWidth={2.5} /> Streak broken
            </p>
            <p className="text-slate-400 text-sm mt-1.5">
              Answer: <span className="font-semibold text-white">{correctAnswer}</span>
            </p>
            {mode === 'en-bg' && word.cyr && (
              <p className="text-slate-500 text-xs mt-0.5">{word.cyr}</p>
            )}
          </div>
        )}
      </div>

      {/* Playing → input; Wrong → try again / quit */}
      {showWrong ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={continueAfterWrong}
            className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-lg py-3.5 font-medium text-base transition-all duration-200 min-h-[56px]"
          >
            Continue
          </button>
          <button
            onClick={quit}
            className="w-full text-slate-400 hover:text-white rounded-lg py-3 font-medium text-sm transition-all duration-200"
          >
            Quit to map
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
            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-4 py-3.5 text-lg focus:outline-none focus:border-violet-500/50 transition-all duration-200 disabled:opacity-40 min-h-[56px]"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!answer.trim() || phase !== 'playing'}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-3.5 font-medium text-base transition-all duration-200 disabled:opacity-40 min-h-[56px]"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  )
}
