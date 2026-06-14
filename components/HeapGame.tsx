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

  useEffect(() => {
    if (phase === 'playing' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase, wordIndex])

  useEffect(() => {
    if (phase !== 'playing') return
    if (mode === 'bg-en') speak(word.bg, 'bg-BG')
  }, [phase, wordIndex, mode, word.bg, speak])

  const saveProgress = useCallback(async (loops: number, attempts: number, streak: number, done: boolean) => {
    setSaving(true)
    try {
      await fetch(`/api/heaps/${heap.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loops_completed: loops,
          total_attempts: attempts,
          best_streak: streak,
          completed: done,
        }),
      })
    } catch (err) {
      console.error('Failed to save progress:', err)
    } finally {
      setSaving(false)
    }
  }, [heap.id])

  // Feedback timer
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
  }, [answer, phase, mode, word, consecutive, currentStreak, maxStreak, totalAttempts, correctAnswer, currentLoop, wordIndex])

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
    Verbs: '⚡', Emotions: '😊',
  }

  // ── Mode Select ──────────────────────────────────────────────────────────
  if (phase === 'mode-select') {
    return (
      <div className="flex flex-col items-center px-4 py-8 gap-6">
        <div className="text-center">
          <div className="text-5xl mb-2">{themeEmoji[heap.theme] ?? '📦'}</div>
          <h1 className="text-xl font-bold text-blue-900">{heap.name}</h1>
          {heap.description && <p className="text-sm text-gray-500 mt-1">{heap.description}</p>}
          {progress?.completed && (
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              ✓ Completed — replay for practice
            </span>
          )}
        </div>

        <div className="w-full bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs text-blue-700 font-semibold mb-1 uppercase tracking-wide">Words in this heap</p>
          <div className="grid grid-cols-2 gap-2">
            {heap.words.map((w) => (
              <div key={w.en} className="text-sm">
                <span className="text-gray-700">{w.en}</span>
                <span className="text-gray-400 mx-1">→</span>
                <span className="text-blue-800 font-medium">{w.bg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full">
          <p className="text-center text-sm text-gray-500 mb-4">Choose a learning mode to begin</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => startGame('en-bg')}
              className="w-full bg-blue-900 text-white rounded-2xl py-4 px-5 text-left shadow-md active:scale-95 transition-transform"
            >
              <div className="font-bold text-lg">English → Bulgarian</div>
              <div className="text-blue-300 text-sm mt-0.5">Type the Cyrillic answer (хляб) or transliteration (hlyab)</div>
            </button>
            <button
              onClick={() => startGame('bg-en')}
              className="w-full bg-yellow-500 text-yellow-900 rounded-2xl py-4 px-5 text-left shadow-md active:scale-95 transition-transform"
            >
              <div className="font-bold text-lg">Bulgarian → English</div>
              <div className="text-yellow-800 text-sm mt-0.5">Hear and see the Cyrillic word, type English</div>
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center px-4">
          Get all 5 words correct twice in a row to complete this heap
        </p>
      </div>
    )
  }

  // ── Loop Done ─────────────────────────────────────────────────────────────
  if (phase === 'loop-done') {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 gap-6 min-h-[60vh]">
        <div className="text-6xl">⚓</div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-900">Loop 1 Complete!</h2>
          <p className="text-gray-500 mt-2">You got all 5 words right. One more loop to go!</p>
        </div>
        <div className="w-full bg-blue-50 rounded-2xl p-4 border border-blue-100">
          {heap.words.map((w) => (
            <div key={w.en} className="flex justify-between py-1.5 border-b border-blue-100 last:border-0">
              <span className="text-gray-700 text-sm">{w.en}</span>
              <span className="text-blue-800 font-medium text-sm">{w.bg}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setPhase('playing')}
          className="w-full bg-blue-900 text-white rounded-2xl py-4 font-bold text-lg shadow-md active:scale-95 transition-transform"
        >
          Start Loop 2 →
        </button>
      </div>
    )
  }

  // ── Heap Complete ─────────────────────────────────────────────────────────
  if (phase === 'heap-complete') {
    return (
      <div className="flex flex-col items-center px-4 py-8 gap-6">
        <div className="text-center">
          <div className="text-6xl mb-2">🏴‍☠️</div>
          <h2 className="text-2xl font-bold text-blue-900">Heap Complete!</h2>
          <p className="text-gray-500 mt-1 text-sm">
            5 new words added to your dictionary
          </p>
          {saving && <p className="text-xs text-gray-400 mt-1">Saving progress…</p>}
        </div>

        <div className="w-full bg-white rounded-2xl shadow-md border border-blue-100 overflow-hidden">
          <div className="bg-blue-900 px-4 py-2">
            <p className="text-white font-semibold text-sm">{heap.name} — Words Unlocked</p>
          </div>
          {heap.words.map((w) => (
            <div key={w.en} className="flex items-center justify-between px-4 py-3 border-b border-blue-50 last:border-0">
              <span className="text-gray-700 text-sm font-medium">{w.en}</span>
              <div className="text-right">
                <div className="text-blue-800 font-bold text-sm">{w.bg}</div>
                {w.cyr && <div className="text-gray-400 text-xs">{w.cyr}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full flex flex-col gap-3">
          {nextHeapId && (
            <button
              onClick={() => router.push(`/heap/${nextHeapId}`)}
              className="w-full bg-yellow-500 text-yellow-900 rounded-2xl py-4 font-bold text-lg shadow-md active:scale-95 transition-transform"
            >
              Next Heap →
            </button>
          )}
          <button
            onClick={() => router.push('/map')}
            className="w-full bg-blue-900 text-white rounded-2xl py-4 font-bold text-lg shadow-md active:scale-95 transition-transform"
          >
            Back to Map
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
    <div className="flex flex-col px-4 py-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/map')} className="text-gray-400 text-sm">← Map</button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">
            Loop {currentLoop} of 2
          </span>
          <div className="flex gap-1">
            {heap.words.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < consecutive ? 'bg-green-500' : i === wordIndex ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-gray-400">{wordIndex + 1}/5</span>
      </div>

      {/* Prompt */}
      <div
        className={`w-full rounded-2xl p-6 text-center transition-colors ${
          showCorrect ? 'bg-green-50 border-2 border-green-400' :
          showWrong ? 'bg-red-50 border-2 border-red-400' :
          'bg-blue-50 border border-blue-100'
        }`}
      >
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
          {mode === 'en-bg' ? 'Translate to Bulgarian' : 'Translate to English'}
        </p>
        <p className="text-3xl font-bold text-blue-900 mb-1">{prompt}</p>
        {mode === 'bg-en' && (
          <button
            onClick={() => speak(word.bg, 'bg-BG')}
            className="text-2xl mt-1 opacity-60 hover:opacity-100"
            aria-label="Listen"
          >
            🔊
          </button>
        )}

        {showCorrect && (
          <div className="mt-3">
            <p className="text-green-700 font-bold text-lg">✓ Correct!</p>
          </div>
        )}
        {showWrong && (
          <div className="mt-3">
            <p className="text-red-600 font-bold text-base">✗ Not quite</p>
            <p className="text-gray-700 text-sm mt-1">
              Correct: <span className="font-bold text-blue-900">{fb!.correctAnswer}</span>
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
          placeholder={mode === 'en-bg' ? 'Type in Bulgarian (Cyrillic or хляб / hlyab)…' : 'Type in English…'}
          disabled={phase !== 'playing'}
          className="w-full border-2 border-blue-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:border-blue-500 bg-white disabled:opacity-50"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={!answer.trim() || phase !== 'playing'}
          className="w-full bg-blue-900 text-white rounded-2xl py-4 font-bold text-lg shadow-md active:scale-95 transition-transform disabled:opacity-40"
        >
          Submit
        </button>
      </form>

      {/* Streak indicator */}
      {consecutive > 0 && phase === 'playing' && (
        <p className="text-center text-sm text-green-600 font-medium">
          🔥 {consecutive}/5 in a row
        </p>
      )}
    </div>
  )
}
