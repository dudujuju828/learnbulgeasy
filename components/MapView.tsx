'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface HeapNode {
  id: string
  name: string
  description: string | null
  theme: string
  unlocked: boolean
  completed: boolean
  inProgress: boolean
  loops_completed: number
  isCurrent: boolean
}

export interface MapData {
  id: number
  name: string
  theme: string
  description: string | null
  heaps: HeapNode[]
}

const THEME_EMOJI: Record<string, string> = {
  // Map 1 — Beginners Bay
  Greetings: '👋', Numbers: '🔢', Food: '🍞', Colors: '🎨',
  Family: '👨‍👩‍👧', Body: '💪', Time: '⏰', Travel: '✈️',
  Verbs: '⚡', Emotions: '😊', Places: '🏔️', Objects: '🏠',
  Weather: '☀️', Animals: '🐾', Clothes: '👕', Adjectives: '✨',
  Actions: '🎯',
  // Map 2 — Pirate's Passage
  'At Home': '🛋️', Nature: '🌿', Work: '💼', Health: '🩺',
  Shopping: '🛒', School: '🎓', Hobbies: '🎸', City: '🏙️',
}

interface MapTheme {
  page: string
  title: string
  subtitle: string
  accentText: string
  rope: string
  wave: string
  streakBadge: string
  emptyText: string
  icons: { completed: string; current: string; unlocked: string; locked: string }
  node: { completed: string; current: string; unlocked: string; locked: string }
  card: { completed: string; current: string; unlocked: string }
  cardTitle: { completed: string; current: string; unlocked: string }
  badge: { completed: string; inProgress: string; current: string }
  chevron: { completed: string; other: string }
  statsBar: string
  fog: boolean
}

const THEMES: Record<string, MapTheme> = {
  pirate: {
    page: 'bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900',
    title: 'text-yellow-300',
    subtitle: 'text-blue-300/80',
    accentText: 'text-yellow-300',
    rope: 'border-yellow-500/25',
    wave: 'text-blue-400/30',
    streakBadge: 'bg-yellow-400 text-yellow-900 shadow-yellow-900/40',
    emptyText: 'text-blue-300',
    icons: { completed: '💰', current: '🚢', unlocked: '⚓', locked: '🔒' },
    node: {
      completed: 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 animate-treasure-glow',
      current: 'bg-gradient-to-br from-blue-400 to-blue-500 border-blue-200 animate-current-pulse',
      unlocked: 'bg-blue-800 border-blue-600',
      locked: 'bg-blue-950 border-blue-800 opacity-50',
    },
    card: {
      completed: 'bg-yellow-400/10 border-yellow-500/25 shadow-sm shadow-yellow-900/20',
      current: 'bg-blue-500/20 border-blue-400/40 shadow-lg shadow-blue-950/60',
      unlocked: 'bg-blue-900/30 border-blue-700/30',
    },
    cardTitle: { completed: 'text-yellow-300', current: 'text-white', unlocked: 'text-blue-200' },
    badge: {
      completed: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/25',
      inProgress: 'text-blue-300 bg-blue-400/15 border-blue-400/25',
      current: 'text-blue-200 bg-blue-400/15 border-blue-300/25',
    },
    chevron: { completed: 'text-yellow-400', other: 'text-blue-500' },
    statsBar: 'bg-blue-950/60 border-blue-700/30',
    fog: false,
  },
  straits: {
    page: 'bg-gradient-to-b from-[#03201c] via-teal-950 to-emerald-900',
    title: 'text-amber-200',
    subtitle: 'text-teal-300/80',
    accentText: 'text-amber-200',
    rope: 'border-amber-300/20',
    wave: 'text-teal-400/30',
    streakBadge: 'bg-amber-300 text-teal-900 shadow-teal-900/40',
    emptyText: 'text-teal-300',
    icons: { completed: '🏮', current: '⛵', unlocked: '🪸', locked: '🌫️' },
    node: {
      completed: 'bg-gradient-to-br from-amber-300 to-orange-400 border-amber-200 animate-treasure-glow',
      current: 'bg-gradient-to-br from-rose-400 to-orange-400 border-rose-200 animate-current-pulse',
      unlocked: 'bg-teal-800 border-teal-600',
      locked: 'bg-teal-950 border-teal-800 opacity-50',
    },
    card: {
      completed: 'bg-amber-300/10 border-amber-300/25 shadow-sm shadow-teal-900/20',
      current: 'bg-rose-400/15 border-rose-300/40 shadow-lg shadow-teal-950/60',
      unlocked: 'bg-teal-900/30 border-teal-700/30',
    },
    cardTitle: { completed: 'text-amber-200', current: 'text-white', unlocked: 'text-teal-200' },
    badge: {
      completed: 'text-amber-300 bg-amber-300/10 border-amber-300/25',
      inProgress: 'text-rose-200 bg-rose-400/15 border-rose-300/25',
      current: 'text-rose-100 bg-rose-400/15 border-rose-200/25',
    },
    chevron: { completed: 'text-amber-300', other: 'text-teal-500' },
    statsBar: 'bg-teal-950/60 border-teal-700/30',
    fog: false,
  },
}

const WAVE = '～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～'

export default function MapView({ maps, initialMapId }: { maps: MapData[]; initialMapId: number }) {
  const [selectedId, setSelectedId] = useState(initialMapId)

  // Empty state — DB not connected / not migrated
  if (maps.length === 0) {
    return (
      <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 pb-8">
        <div className="relative px-4 pt-8 pb-4 text-center">
          <div className="text-5xl mb-2 animate-float inline-block">🧭</div>
          <h1 className="font-pirata text-4xl text-yellow-300 tracking-wide drop-shadow-lg">Voyage Map</h1>
          <p className="text-blue-300/80 text-sm mt-1">Navigate the seas of Bulgarian</p>
        </div>
        <div className="mx-4 mt-4 bg-blue-900/40 rounded-2xl p-6 text-center border border-blue-600/30 backdrop-blur-sm">
          <div className="text-4xl mb-3 animate-float inline-block">⚓</div>
          <h2 className="font-pirata text-2xl text-yellow-300 mb-2">Seas Uncharted</h2>
          <p className="text-sm text-blue-300">
            Database not connected. Deploy to Vercel and run migrations to begin your voyage.
          </p>
        </div>
      </div>
    )
  }

  const selected = maps.find(m => m.id === selectedId) ?? maps[0]
  const t = THEMES[selected.theme] ?? THEMES.pirate

  // Per-selected-map stats
  let streak = 0
  for (const h of selected.heaps) {
    if (h.completed) streak++
    else break
  }
  const completedCount = selected.heaps.filter(h => h.completed).length

  // Endless Voyage available once anything is completed anywhere
  const anyCompleted = maps.some(m => m.heaps.some(h => h.completed))

  return (
    <div className={`relative min-h-full pb-8 ${t.page}`}>
      {/* Fog / mist drift (Pirate's Passage) */}
      {selected.theme === 'straits' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
          <div className="map-fog map-fog-1" />
          <div className="map-fog map-fog-2" />
        </div>
      )}

      {/* Stars (Beginners Bay) */}
      {selected.theme !== 'straits' && (
        <div className="absolute inset-x-0 top-0 h-48 pointer-events-none select-none overflow-hidden">
          <span className="absolute top-4 left-6 text-yellow-100/50 text-[10px]">✦</span>
          <span className="absolute top-8 left-1/4 text-yellow-200/40 text-xs">★</span>
          <span className="absolute top-3 right-10 text-yellow-100/60 text-xs">★</span>
          <span className="absolute top-12 right-1/4 text-yellow-200/30 text-[10px]">✦</span>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 px-4 pt-8 pb-3 text-center">
        <div className="text-5xl mb-2 animate-float inline-block">{selected.theme === 'straits' ? '🏮' : '🧭'}</div>
        <h1 className={`font-pirata text-4xl tracking-wide drop-shadow-lg ${t.title}`}>{selected.name}</h1>
        <p className={`text-sm mt-1 ${t.subtitle}`}>
          {selected.description ?? 'Navigate the seas of Bulgarian'}
        </p>

        {streak > 0 && (
          <div className={`inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg ${t.streakBadge}`}>
            <span>🔥</span>
            <span>{streak} island{streak !== 1 ? 's' : ''} conquered!</span>
          </div>
        )}
      </div>

      {/* Map switcher */}
      {maps.length > 1 && (
        <div className="relative z-10 px-4 pb-2">
          <div className="flex gap-2 p-1 rounded-2xl bg-black/25 border border-white/10 backdrop-blur-sm">
            {maps.map(m => {
              const active = m.id === selected.id
              const mt = THEMES[m.theme] ?? THEMES.pirate
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`flex-1 py-2 px-2 rounded-xl text-sm font-semibold transition-all min-h-[40px] ${
                    active
                      ? `${mt.statsBar} ${mt.accentText} shadow-inner border border-white/10`
                      : 'text-white/50'
                  }`}
                >
                  {m.theme === 'straits' ? '🏮 ' : '⚓ '}{m.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Endless Voyage */}
      {anyCompleted && (
        <div className="relative z-10 px-4 pb-1">
          <Link
            href="/infinite"
            className="flex items-center gap-3 w-full rounded-2xl p-3.5 bg-gradient-to-br from-purple-700 to-indigo-800 border border-purple-400/30 shadow-lg shadow-indigo-950/50 active:scale-95 transition-transform min-h-[60px]"
          >
            <span className="text-3xl shrink-0 animate-float">⚡</span>
            <div className="flex-1 min-w-0">
              <p className="font-pirata text-xl text-yellow-300 tracking-wide leading-tight">Endless Voyage</p>
              <p className="text-xs text-indigo-200/80 mt-0.5">Drill your treasure words — chase your best streak</p>
            </div>
            <span className="text-yellow-400 text-lg shrink-0">›</span>
          </Link>
        </div>
      )}

      {/* Animated waves */}
      <div className="relative z-10 overflow-hidden h-6 mb-4 select-none">
        <div className={`text-2xl whitespace-nowrap animate-wave ${t.wave}`}>{WAVE}</div>
      </div>

      {/* Heap list */}
      <div className="relative z-10 px-4">
        <div className={`absolute left-[36px] top-0 bottom-0 w-0.5 border-l-2 border-dashed z-0 ${t.rope}`} />

        <div className="flex flex-col gap-0">
          {selected.heaps.map(heap => {
            const emoji = THEME_EMOJI[heap.theme] ?? '📦'
            const nodeIcon = heap.completed
              ? t.icons.completed
              : heap.isCurrent
              ? t.icons.current
              : heap.unlocked
              ? t.icons.unlocked
              : t.icons.locked
            const nodeClass = heap.completed
              ? t.node.completed
              : heap.isCurrent
              ? t.node.current
              : heap.unlocked
              ? t.node.unlocked
              : t.node.locked

            return (
              <div key={heap.id} className="relative flex items-start gap-3 pb-3">
                <div className="relative z-10 flex flex-col items-center w-9 pt-0.5 shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-lg border-2 transition-all ${nodeClass}`}>
                    {nodeIcon}
                  </div>
                </div>

                {heap.unlocked ? (
                  <Link
                    href={`/heap/${heap.id}`}
                    className={`flex-1 rounded-2xl p-3.5 border flex items-center gap-3 active:scale-95 transition-all min-h-[60px] ${
                      heap.completed ? t.card.completed : heap.isCurrent ? t.card.current : t.card.unlocked
                    }`}
                  >
                    <span className={`text-2xl shrink-0 ${!heap.completed && !heap.isCurrent ? 'opacity-50' : ''}`}>
                      {emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm leading-tight ${
                        heap.completed ? t.cardTitle.completed : heap.isCurrent ? t.cardTitle.current : t.cardTitle.unlocked
                      }`}>
                        {heap.name}
                      </p>
                      {heap.description && (
                        <p className="text-xs text-white/45 mt-0.5 truncate">{heap.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {heap.completed && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${t.badge.completed}`}>
                            ✓ Plundered
                          </span>
                        )}
                        {heap.inProgress && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${t.badge.inProgress}`}>
                            Loop {heap.loops_completed}/2
                          </span>
                        )}
                        {heap.isCurrent && !heap.inProgress && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${t.badge.current}`}>
                            ▶ Next island
                          </span>
                        )}
                        {!heap.completed && !heap.inProgress && !heap.isCurrent && (
                          <span className="text-xs text-white/40 font-medium">5 words · 2 loops</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-base shrink-0 ${heap.completed ? t.chevron.completed : t.chevron.other}`}>›</span>
                  </Link>
                ) : (
                  <div className="flex-1 rounded-2xl p-3.5 border bg-black/30 border-white/10 flex items-center gap-3 opacity-35 min-h-[60px]">
                    <span className="text-2xl grayscale">{t.icons.locked}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white/60 text-sm">{heap.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">Conquer previous island to unlock</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Second wave divider */}
      <div className="relative z-10 overflow-hidden h-5 my-4 select-none">
        <div className={`text-2xl whitespace-nowrap ${t.wave}`} style={{ animation: 'wave-scroll 12s linear infinite reverse' }}>
          {WAVE}
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 mx-4">
        <div className={`flex justify-around py-4 rounded-2xl border backdrop-blur-sm ${t.statsBar}`}>
          <div className="text-center">
            <p className={`text-xl font-bold ${t.accentText}`}>{completedCount}</p>
            <p className="text-xs text-white/50 mt-0.5">🏝️ Islands</p>
          </div>
          <div className="w-px bg-white/15" />
          <div className="text-center">
            <p className={`text-xl font-bold ${t.accentText}`}>{completedCount * 5}</p>
            <p className="text-xs text-white/50 mt-0.5">💰 Words</p>
          </div>
          <div className="w-px bg-white/15" />
          <div className="text-center">
            <p className={`text-xl font-bold ${t.accentText}`}>{streak > 0 ? `🔥${streak}` : '—'}</p>
            <p className="text-xs text-white/50 mt-0.5">🔥 Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}
