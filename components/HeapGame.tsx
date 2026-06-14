'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Volume2, Check, X } from 'lucide-react'
import type { Heap, UserProgress } from '@/lib/types'
import { matchesAnswer, matchesEnAnswer } from '@/lib/vocab'

type Mode = 'en-bg' | 'bg-en'
type Phase = 'mode-select' | 'playing' | 'feedback' | 'loop-done' | 'heap-complete'

interface FeedbackSnapshot {
  isCorrect: boolean
  correctAnswer: string
  newConsecutive: number
  newLoop: 1 | 2
  newWordIndex: number
  totalAttempts: number
  maxStreak: number
}

interface Props {
  heap: Heap
  progress: UserProgress | null
  nextHeapId: string | null
}

export default function HeapGame({ heap, progress, nextHeapId }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('mode-select')
  const [mode, setMode] = useState<Mode>('en-bg')
  const [currentLoop, setCurrentLoop] = useState<1 | 2>(1)
  const [wordIndex, setWordIndex] = useState(0)
  const [consecutive, setConsecutive] = useState(0)
  const [answer, setAnswer] = useState('')
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [saving, setSaving] = useState(false)

  const feedbackRef = useRef<FeedbackSnapshot | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const word = heap.words[wordIndex]
  const prompt = mode === 'en-bg' ? word.en : word.bg
  const correctAnswer = mode === 'en-bg' ? word.bg : word.en

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

  useEffect(() => {
    if (phase === 'playing' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase, wordIndex])

  useEffect(() => {
    if (phase === 'heap-complete') vibrate([50, 50, 100])
  }, [phase, vibrate])

  useEffect(() => {
    if (phase !== 'playing') return
    if (mode === 'bg-en') speak(word.bg, 'bg-BG')
  }, [phase, wordIndex, mode, word.bg, speak])

  const saveProgress = useCallback(async (loops: number, attempts: number, streak: number, done: boolean) => {
    setSaving(true)
    const data = {
      loops_completed: loops,
      total_attempts: attempts,
      best_streak: streak,
      completed: done,
    }
    try {
      const res = await fetch(`/api/heaps/${heap.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Server error')
    } catch (err) {
      // Offline or error — queue for sync when back online, and keep the
      // offline heap cache consistent so replays reflect local progress.
      console.warn('[heap] progress save failed, queuing for sync', err)
      try {
        const { queueProgressSync, updateCachedProgress } = await import('@/lib/idb')
        await queueProgressSync(heap.id, data)
        await updateCachedProgress(heap.id, data)
      } catch (idbErr) {
        console.error('[heap] IDB unavailable — progress lost this session', idbErr)
      }
    } finally {
      setSaving(false)
    }
  }, [heap.id])

  useEffect(() => {
    if (phase !== 'feedback') return
    const fb = feedbackRef.current!
    const delay = fb.isCorrect ? 700 : 1400

    const timer = setTimeout(async () => {
      if (fb.isCorrect && fb.newConsecutive >= 5) {
        if (fb.newLoop === 1) {
          await saveProgress(1, fb.totalAttempts, fb.maxStreak, false)
          setConsecutive(0)
          setWordIndex(0)
          setCurrentLoop(2)
          setPhase('loop-done')
        } else {
          await saveProgress(2, fb.totalAttempts, fb.maxStreak, true)
          setPhase('heap-complete')
        }
      } else if (fb.isCorrect) {
        setWordIndex(fb.newWordIndex)
        setConsecutive(fb.newConsecutive)
        setPhase('playing')
      } else {
        setWordIndex(0)
        setConsecutive(0)
        setPhase('playing')
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [phase, saveProgress])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim() || phase !== 'playing') return

    const isCorrect = mode === 'en-bg'
      ? matchesAnswer(answer, word.bg, word.cyr)
      : matchesEnAnswer(answer, word.en)

    vibrate(isCorrect ? 8 : [15, 40, 15])

    const newConsecutive = isCorrect ? consecutive + 1 : 0
    const newStreak = isCorrect ? currentStreak + 1 : 0
    const newMaxStreak = Math.max(maxStreak, newStreak)
    const newTotal = totalAttempts + 1

    setTotalAttempts(newTotal)
    setCurrentStreak(newStreak)
    setMaxStreak(newMaxStreak)
    setAnswer('')

    feedbackRef.current = {
      isCorrect,
      correctAnswer,
      newConsecutive,
      newLoop: currentLoop,
      newWordIndex: wordIndex + 1,
      totalAttempts: newTotal,
      maxStreak: newMaxStreak,
    }

    setPhase('feedback')
  }, [answer, phase, mode, word, consecutive, currentStreak, maxStreak, totalAttempts, correctAnswer, currentLoop, wordIndex, vibrate])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit(e as unknown as React.FormEvent)
  }, [handleSubmit])

  const startGame = useCallback((selectedMode: Mode) => {
    setMode(selectedMode)
    setCurrentLoop(1)
    setWordIndex(0)
    setConsecutive(0)
    setAnswer('')
    setTotalAttempts(0)
    setCurrentStreak(0)
    setMaxStreak(0)
    setPhase('playing')
  }, [])

  // ── Mode Select ──────────────────────────────────────────────────────────
  if (phase === 'mode-select') {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col px-5 py-8 gap-6 animate-fade-in">
        <div>
          <button
            onClick={() => router.push('/map')}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors duration-200 -ml-1 mb-4 min-h-[44px]"
          >
            <ArrowLeft size={16} /> Map
          </button>
          <h1 className="text-2xl font-semibold text-white tracking-tight">{heap.name}</h1>
          {heap.description && (
            <p className="text-sm text-slate-400 mt-1">{heap.description}</p>
          )}
          {progress?.completed && (
            <span className="inline-block mt-3 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
              Completed — replay for practice
            </span>
          )}
        </div>

        {/* Word preview */}
        <div className="w-full bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Words in this heap</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {heap.words.map((w) => (
              <div key={w.en} className="text-sm flex items-center gap-1.5">
                <span className="text-slate-400">{w.en}</span>
                <span className="text-slate-600">→</span>
                <span className="text-white font-medium">{w.bg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Choose a mode</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => startGame('en-bg')}
              className="w-full bg-white/5 hover:bg-white/[0.08] text-white rounded-xl py-4 px-5 text-left border border-white/10 transition-all duration-200"
            >
              <div className="font-medium text-base">English → Bulgarian</div>
              <div className="text-slate-400 text-sm mt-0.5">Type the Cyrillic answer (хляб) or transliteration (hlyab)</div>
            </button>
            <button
              onClick={() => startGame('bg-en')}
              className="w-full bg-white/5 hover:bg-white/[0.08] text-white rounded-xl py-4 px-5 text-left border border-white/10 transition-all duration-200"
            >
              <div className="font-medium text-base">Bulgarian → English</div>
              <div className="text-slate-400 text-sm mt-0.5">Hear and see the Cyrillic word, type English</div>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Get all 5 words correct twice in a row to complete this heap
        </p>
      </div>
    )
  }

  // ── Loop Done ─────────────────────────────────────────────────────────────
  if (phase === 'loop-done') {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center px-5 py-12 gap-6 animate-fade-in">
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mb-4">
            <Check size={28} strokeWidth={2.5} />
          </span>
          <h2 className="text-2xl font-semibold text-white">Loop 1 complete</h2>
          <p className="text-slate-400 mt-2 text-sm">All 5 correct. One more loop to finish.</p>
        </div>
        <div className="w-full bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/10">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Word review</p>
          </div>
          {heap.words.map((w) => (
            <div key={w.en} className="flex justify-between items-center px-4 py-3 border-b border-white/5 last:border-0">
              <span className="text-slate-400 text-sm">{w.en}</span>
              <span className="text-white font-medium text-sm">{w.bg}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setPhase('playing')}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-3.5 font-medium text-base transition-all duration-200"
        >
          Start loop 2
        </button>
      </div>
    )
  }

  // ── Heap Complete ─────────────────────────────────────────────────────────
  if (phase === 'heap-complete') {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col px-5 py-8 gap-5 animate-fade-in">
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 mb-4 animate-scale-in">
            <Check size={32} strokeWidth={2.5} />
          </span>
          <h2 className="text-2xl font-semibold text-white">Heap complete</h2>
          <p className="text-slate-400 mt-1 text-sm">
            Both loops done — 5 words added to your vocabulary.
          </p>
          {saving && <p className="text-xs text-slate-500 mt-2">Saving…</p>}
        </div>

        {/* Words unlocked */}
        <div className="w-full bg-white/5 rounded-xl border border-emerald-500/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-emerald-500/[0.06]">
            <p className="text-white font-medium text-sm">{heap.name}</p>
            <p className="text-emerald-400/80 text-xs mt-0.5">5 words unlocked</p>
          </div>
          {heap.words.map((w) => (
            <div key={w.en} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
              <span className="text-slate-400 text-sm font-medium">{w.en}</span>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-white font-semibold text-sm">{w.bg}</div>
                  {w.cyr && <div className="text-slate-500 text-xs">{w.cyr}</div>}
                </div>
                <button
                  onClick={() => speak(w.bg, 'bg-BG')}
                  className="text-slate-500 hover:text-white transition-colors duration-200"
                  aria-label={`Speak ${w.bg}`}
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {nextHeapId && (
            <button
              onClick={() => router.push(`/heap/${nextHeapId}`)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-3.5 font-medium text-base transition-all duration-200"
            >
              Next heap
            </button>
          )}
          <button
            onClick={() => router.push('/dictionary')}
            className="w-full bg-white/10 hover:bg-white/[0.15] text-white border border-white/10 rounded-lg py-3.5 font-medium text-base transition-all duration-200"
          >
            View vocabulary
          </button>
          <button
            onClick={() => router.push('/map')}
            className="w-full text-slate-400 hover:text-white rounded-lg py-3 font-medium text-sm transition-all duration-200"
          >
            Back to map
          </button>
        </div>
      </div>
    )
  }

  // ── Playing / Feedback ────────────────────────────────────────────────────
  const fb = feedbackRef.current
  const showFeedback = phase === 'feedback' && fb !== null
  const showCorrect = showFeedback && fb.isCorrect
  const showWrong = showFeedback && !fb.isCorrect

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col px-5 py-5 gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/map')}
          className="flex items-center gap-1 text-slate-400 hover:text-white text-sm py-2 pr-2 min-h-[44px] transition-colors duration-200"
        >
          <ArrowLeft size={16} /> Map
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Loop {currentLoop}/2
          </span>
          <div className="flex gap-1">
            {heap.words.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i < consecutive
                    ? 'bg-emerald-400'
                    : i === wordIndex
                    ? 'bg-slate-400'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-slate-500">{wordIndex + 1}/5</span>
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
              <X size={18} strokeWidth={2.5} /> Not quite
            </p>
            <p className="text-slate-400 text-sm mt-1.5">
              Correct: <span className="font-semibold text-white">{fb!.correctAnswer}</span>
            </p>
          </div>
        )}
      </div>

      {/* Answer input */}
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
          className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-4 py-3.5 text-lg focus:outline-none focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-40 min-h-[56px]"
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

      {/* Streak */}
      {consecutive > 0 && phase === 'playing' && (
        <p className="text-center text-sm text-slate-400 font-medium">
          {consecutive}/5 correct in a row
        </p>
      )}
    </div>
  )
}
