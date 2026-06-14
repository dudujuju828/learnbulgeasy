'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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

  const themeEmoji: Record<string, string> = {
    Greetings: '👋', Numbers: '🔢', Food: '🍞', Colors: '🎨',
    Family: '👨‍👩‍👧', Body: '💪', Time: '⏰', Travel: '✈️',
    Verbs: '⚡', Emotions: '😊', Places: '🏔️', Objects: '🏠',
    Weather: '☀️', Animals: '🐾', Clothes: '👕', Adjectives: '✨',
    Actions: '🎯',
  }

  // ── Mode Select ──────────────────────────────────────────────────────────
  if (phase === 'mode-select') {
    return (
      <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 flex flex-col px-4 py-8 gap-6">
        <div className="text-center">
          <div className="text-6xl mb-3 animate-float inline-block">
            {themeEmoji[heap.theme] ?? '📦'}
          </div>
          <h1 className="font-pirata text-3xl text-yellow-300 tracking-wide">{heap.name}</h1>
          {heap.description && (
            <p className="text-sm text-blue-300 mt-1">{heap.description}</p>
          )}
          {progress?.completed && (
            <span className="inline-block mt-2 text-xs bg-yellow-400/20 text-yellow-300 border border-yellow-500/30 px-3 py-1 rounded-full font-medium">
              ✓ Already plundered — replay for practice
            </span>
          )}
        </div>

        {/* Ship's manifest — word preview */}
        <div className="w-full bg-blue-950/60 rounded-2xl p-4 border border-blue-700/40 backdrop-blur-sm">
          <p className="text-xs text-yellow-400/80 font-semibold mb-2 uppercase tracking-wider">📜 Ship&apos;s Manifest</p>
          <div className="grid grid-cols-2 gap-2">
            {heap.words.map((w) => (
              <div key={w.en} className="text-sm flex items-center gap-1">
                <span className="text-blue-200">{w.en}</span>
                <span className="text-blue-600">→</span>
                <span className="text-yellow-300 font-medium">{w.bg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full">
          <p className="text-center text-sm text-blue-400 mb-4">Choose your navigation mode</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => startGame('en-bg')}
              className="w-full bg-gradient-to-br from-blue-800 to-blue-900 text-white rounded-2xl py-4 px-5 text-left shadow-lg border border-blue-600/30 active:scale-95 transition-transform"
            >
              <div className="font-bold text-lg">🗺️ English → Bulgarian</div>
              <div className="text-blue-300 text-sm mt-0.5">Type the Cyrillic answer (хляб) or transliteration (hlyab)</div>
            </button>
            <button
              onClick={() => startGame('bg-en')}
              className="w-full bg-gradient-to-br from-amber-500 to-yellow-600 text-yellow-900 rounded-2xl py-4 px-5 text-left shadow-lg active:scale-95 transition-transform"
            >
              <div className="font-bold text-lg">⚓ Bulgarian → English</div>
              <div className="text-yellow-800 text-sm mt-0.5">Hear and see the Cyrillic word, type English</div>
            </button>
          </div>
        </div>

        <p className="text-xs text-blue-500 text-center px-4">
          ⚔️ Get all 5 words correct twice in a row to plunder this island
        </p>
      </div>
    )
  }

  // ── Loop Done ─────────────────────────────────────────────────────────────
  if (phase === 'loop-done') {
    return (
      <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 flex flex-col items-center justify-center px-6 py-12 gap-6">
        <div className="text-7xl animate-float inline-block">⚓</div>
        <div className="text-center">
          <h2 className="font-pirata text-4xl text-yellow-300">First Island Mapped!</h2>
          <p className="text-blue-300 mt-2">You got all 5 words right. One more voyage to go!</p>
        </div>
        <div className="w-full bg-blue-950/60 rounded-2xl border border-blue-700/40 overflow-hidden">
          <div className="bg-blue-900/60 px-4 py-2 border-b border-blue-700/40">
            <p className="text-xs text-yellow-400/70 uppercase tracking-wider font-semibold">📜 Word Review</p>
          </div>
          {heap.words.map((w) => (
            <div key={w.en} className="flex justify-between items-center px-4 py-3 border-b border-blue-800/40 last:border-0">
              <span className="text-blue-200 text-sm">{w.en}</span>
              <span className="text-yellow-300 font-medium text-sm">{w.bg}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setPhase('playing')}
          className="w-full bg-gradient-to-br from-amber-500 to-yellow-600 text-yellow-900 rounded-2xl py-4 font-bold text-lg shadow-lg active:scale-95 transition-transform"
        >
          ⚔️ Start Loop 2
        </button>
      </div>
    )
  }

  // ── Heap Complete ─────────────────────────────────────────────────────────
  if (phase === 'heap-complete') {
    return (
      <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 flex flex-col px-4 py-8 gap-5">
        {/* Celebration */}
        <div className="text-center">
          <div className="text-7xl mb-2 animate-bounce inline-block">💰</div>
          <div className="flex justify-center gap-2 mb-3 animate-sparkle">
            {['⭐', '✨', '🌟', '✨', '⭐'].map((s, i) => (
              <span key={i} className="text-xl">{s}</span>
            ))}
          </div>
          <h2 className="font-pirata text-4xl text-yellow-300">Treasure Found!</h2>
          <p className="text-blue-300 mt-1 text-sm">
            Both loops done — 5 words added to your chest!
          </p>
          {saving && <p className="text-xs text-blue-400 mt-2">Saving voyage log…</p>}
        </div>

        {/* Words unlocked */}
        <div className="w-full bg-blue-950/60 rounded-2xl border border-yellow-500/20 overflow-hidden shadow-lg shadow-yellow-900/10">
          <div className="bg-gradient-to-r from-amber-600/80 to-yellow-700/80 px-4 py-3 flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-yellow-100 font-semibold text-sm">{heap.name}</p>
              <p className="text-yellow-300/70 text-xs">5 words unlocked</p>
            </div>
          </div>
          {heap.words.map((w) => (
            <div key={w.en} className="flex items-center justify-between px-4 py-3 border-b border-blue-800/40 last:border-0">
              <span className="text-blue-200 text-sm font-medium">{w.en}</span>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-yellow-300 font-bold text-sm">{w.bg}</div>
                  {w.cyr && <div className="text-blue-500 text-xs">{w.cyr}</div>}
                </div>
                <button
                  onClick={() => speak(w.bg, 'bg-BG')}
                  className="text-base opacity-50 hover:opacity-90 transition-opacity leading-none"
                  aria-label={`Speak ${w.bg}`}
                >
                  🔊
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {nextHeapId && (
            <button
              onClick={() => router.push(`/heap/${nextHeapId}`)}
              className="w-full bg-gradient-to-br from-amber-500 to-yellow-600 text-yellow-900 rounded-2xl py-4 font-bold text-lg shadow-lg active:scale-95 transition-transform"
            >
              ⚔️ Next Island →
            </button>
          )}
          <button
            onClick={() => router.push('/dictionary')}
            className="w-full bg-blue-800 text-yellow-300 border border-yellow-500/25 rounded-2xl py-4 font-bold text-lg shadow-md active:scale-95 transition-transform"
          >
            💰 View Treasure Chest
          </button>
          <button
            onClick={() => router.push('/map')}
            className="w-full bg-blue-950/80 text-blue-300 border border-blue-700/30 rounded-2xl py-3 font-semibold text-base active:scale-95 transition-transform"
          >
            🗺️ Back to Map
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
    <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 flex flex-col px-4 py-5 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/map')}
          className="text-blue-400 text-sm py-2 pr-2 min-h-[44px] flex items-center"
        >
          ← Map
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-400 font-medium">
            Loop {currentLoop}/2
          </span>
          <div className="flex gap-1">
            {heap.words.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i < consecutive
                    ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50'
                    : i === wordIndex
                    ? 'bg-blue-400'
                    : 'bg-blue-800'
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-blue-500">{wordIndex + 1}/5</span>
      </div>

      {/* Prompt card — Captain's Log style */}
      <div
        className={`w-full rounded-2xl p-6 text-center transition-all border-2 ${
          showCorrect
            ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-400/60 shadow-lg shadow-green-900/30'
            : showWrong
            ? 'bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-400/60 shadow-lg shadow-red-900/30'
            : 'bg-gradient-to-br from-blue-900/60 to-blue-950/80 border-blue-700/40 shadow-lg shadow-blue-950/50'
        }`}
      >
        <p className="text-xs text-blue-400/70 uppercase tracking-widest mb-3">
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
            <p className="text-red-300 font-bold text-lg">✗ Not quite</p>
            <p className="text-blue-300 text-sm mt-1.5">
              Correct: <span className="font-bold text-yellow-300 text-base">{fb!.correctAnswer}</span>
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
          className="w-full bg-blue-950/80 border-2 border-blue-700/50 text-white placeholder-blue-600 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:border-yellow-500/50 disabled:opacity-40 min-h-[56px]"
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

      {/* Streak */}
      {consecutive > 0 && phase === 'playing' && (
        <p className="text-center text-sm text-yellow-400 font-medium">
          🔥 {consecutive}/5 on the right course!
        </p>
      )}
    </div>
  )
}
