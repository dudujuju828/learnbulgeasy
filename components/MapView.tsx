'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Lock, ChevronRight, Zap, X } from 'lucide-react'

type Direction = 'mixed' | 'en-bg' | 'bg-en'

const DIRECTION_OPTIONS: { id: Direction; label: string; hint: string }[] = [
  { id: 'mixed', label: 'Mixed', hint: 'Random EN ↔ BG each word' },
  { id: 'en-bg', label: 'EN → BG', hint: 'See English, type Bulgarian' },
  { id: 'bg-en', label: 'BG → EN', hint: 'See Bulgarian, type English' },
]

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

interface Accent {
  text: string
  dot: string
  nodeComplete: string
  nodeCurrent: string
  cardComplete: string
  cardCurrent: string
  badgeComplete: string
  badgeCurrent: string
  switchActive: string
  bar: string
}

// Map 1 → emerald, Map 2 → violet, Map 3 → orange. Subtle accents on a neutral slate canvas.
const ACCENTS: Record<string, Accent> = {
  emerald: {
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    nodeComplete: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    nodeCurrent: 'bg-emerald-500 text-white border-emerald-400 ring-4 ring-emerald-500/15',
    cardComplete: 'bg-emerald-500/[0.07] border-emerald-500/20',
    cardCurrent: 'bg-white/[0.07] border-emerald-500/30',
    badgeComplete: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    badgeCurrent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    switchActive: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    bar: 'bg-emerald-400',
  },
  violet: {
    text: 'text-violet-400',
    dot: 'bg-violet-400',
    nodeComplete: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    nodeCurrent: 'bg-violet-500 text-white border-violet-400 ring-4 ring-violet-500/15',
    cardComplete: 'bg-violet-500/[0.07] border-violet-500/20',
    cardCurrent: 'bg-white/[0.07] border-violet-500/30',
    badgeComplete: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    badgeCurrent: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    switchActive: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    bar: 'bg-violet-400',
  },
  orange: {
    text: 'text-orange-400',
    dot: 'bg-orange-400',
    nodeComplete: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    nodeCurrent: 'bg-orange-500 text-white border-orange-400 ring-4 ring-orange-500/15',
    cardComplete: 'bg-orange-500/[0.07] border-orange-500/20',
    cardCurrent: 'bg-white/[0.07] border-orange-500/30',
    badgeComplete: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    badgeCurrent: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    switchActive: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    bar: 'bg-orange-400',
  },
  amber: {
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    nodeComplete: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    nodeCurrent: 'bg-amber-500 text-white border-amber-400 ring-4 ring-amber-500/15',
    cardComplete: 'bg-amber-500/[0.07] border-amber-500/20',
    cardCurrent: 'bg-white/[0.07] border-amber-500/30',
    badgeComplete: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    badgeCurrent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    switchActive: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    bar: 'bg-amber-400',
  },
  rose: {
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    nodeComplete: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    nodeCurrent: 'bg-rose-500 text-white border-rose-400 ring-4 ring-rose-500/15',
    cardComplete: 'bg-rose-500/[0.07] border-rose-500/20',
    cardCurrent: 'bg-white/[0.07] border-rose-500/30',
    badgeComplete: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    badgeCurrent: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    switchActive: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    bar: 'bg-rose-400',
  },
  cyan: {
    text: 'text-cyan-400',
    dot: 'bg-cyan-400',
    nodeComplete: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    nodeCurrent: 'bg-cyan-500 text-white border-cyan-400 ring-4 ring-cyan-500/15',
    cardComplete: 'bg-cyan-500/[0.07] border-cyan-500/20',
    cardCurrent: 'bg-white/[0.07] border-cyan-500/30',
    badgeComplete: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    badgeCurrent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    switchActive: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    bar: 'bg-cyan-400',
  },
  lime: {
    text: 'text-lime-400',
    dot: 'bg-lime-400',
    nodeComplete: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
    nodeCurrent: 'bg-lime-500 text-white border-lime-400 ring-4 ring-lime-500/15',
    cardComplete: 'bg-lime-500/[0.07] border-lime-500/20',
    cardCurrent: 'bg-white/[0.07] border-lime-500/30',
    badgeComplete: 'text-lime-400 bg-lime-500/10 border-lime-500/20',
    badgeCurrent: 'text-lime-400 bg-lime-500/10 border-lime-500/20',
    switchActive: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
    bar: 'bg-lime-400',
  },
  fuchsia: {
    text: 'text-fuchsia-400',
    dot: 'bg-fuchsia-400',
    nodeComplete: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
    nodeCurrent: 'bg-fuchsia-500 text-white border-fuchsia-400 ring-4 ring-fuchsia-500/15',
    cardComplete: 'bg-fuchsia-500/[0.07] border-fuchsia-500/20',
    cardCurrent: 'bg-white/[0.07] border-fuchsia-500/30',
    badgeComplete: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
    badgeCurrent: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
    switchActive: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
    bar: 'bg-fuchsia-400',
  },
  teal: {
    text: 'text-teal-400',
    dot: 'bg-teal-400',
    nodeComplete: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    nodeCurrent: 'bg-teal-500 text-white border-teal-400 ring-4 ring-teal-500/15',
    cardComplete: 'bg-teal-500/[0.07] border-teal-500/20',
    cardCurrent: 'bg-white/[0.07] border-teal-500/30',
    badgeComplete: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    badgeCurrent: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    switchActive: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    bar: 'bg-teal-400',
  },
  sky: {
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    nodeComplete: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    nodeCurrent: 'bg-sky-500 text-white border-sky-400 ring-4 ring-sky-500/15',
    cardComplete: 'bg-sky-500/[0.07] border-sky-500/20',
    cardCurrent: 'bg-white/[0.07] border-sky-500/30',
    badgeComplete: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    badgeCurrent: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    switchActive: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    bar: 'bg-sky-400',
  },
  indigo: {
    text: 'text-indigo-400',
    dot: 'bg-indigo-400',
    nodeComplete: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    nodeCurrent: 'bg-indigo-500 text-white border-indigo-400 ring-4 ring-indigo-500/15',
    cardComplete: 'bg-indigo-500/[0.07] border-indigo-500/20',
    cardCurrent: 'bg-white/[0.07] border-indigo-500/30',
    badgeComplete: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    badgeCurrent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    switchActive: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    bar: 'bg-indigo-400',
  },
}

const accentFor = (theme: string): Accent => {
  if (theme === 'straits') return ACCENTS.violet
  if (theme === 'volcano') return ACCENTS.orange
  if (theme === 'mountain') return ACCENTS.amber
  if (theme === 'desert') return ACCENTS.rose
  if (theme === 'ice') return ACCENTS.cyan
  if (theme === 'forest') return ACCENTS.lime
  if (theme === 'crystal') return ACCENTS.fuchsia
  if (theme === 'sky') return ACCENTS.teal
  if (theme === 'swamp') return ACCENTS.indigo
  if (theme === 'essential') return ACCENTS.sky
  return ACCENTS.emerald
}

export default function MapView({ maps, initialMapId }: { maps: MapData[]; initialMapId: number }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(initialMapId)
  const [voyageOpen, setVoyageOpen] = useState(false)
  const [direction, setDirection] = useState<Direction>('mixed')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Restore the saved scroll position for the selected map (e.g. after playing a
  // heap and navigating back), and keep saving it as the user scrolls. Keyed by
  // map id so each map remembers its own spot. sessionStorage survives navigation
  // but resets on a fresh load, which is the behaviour we want.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const key = `map-scroll-${selectedId}`
    const saved = sessionStorage.getItem(key)
    el.scrollTop = saved ? parseInt(saved, 10) || 0 : 0
    const onScroll = () => sessionStorage.setItem(key, String(el.scrollTop))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [selectedId])

  const startVoyage = () => {
    setVoyageOpen(false)
    router.push(`/infinite?map=${selectedId}&dir=${direction}`)
  }

  // Empty state — DB not connected / not migrated
  if (maps.length === 0) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-800 px-5 pt-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Map</h1>
          <p className="text-slate-400 text-sm mt-1">Your learning path</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-2">Nothing here yet</h2>
          <p className="text-sm text-slate-400">
            Database not connected. Deploy and run migrations to load your heaps.
          </p>
        </div>
      </div>
    )
  }

  const selected = maps.find(m => m.id === selectedId) ?? maps[0]
  const a = accentFor(selected.theme)

  // Per-selected-map stats
  let streak = 0
  for (const h of selected.heaps) {
    if (h.completed) streak++
    else break
  }
  const completedCount = selected.heaps.filter(h => h.completed).length

  // Infinite Mode is per-map: only offered once this map has unlocked words.
  const canVoyage = completedCount > 0

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-800 pb-10 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <h1 className="text-2xl font-semibold text-white tracking-tight">{selected.name}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {selected.description ?? 'Your learning path'}
        </p>
      </div>

      {/* Map switcher */}
      {maps.length > 1 && (
        <div className="px-5 pb-4">
          <div className="flex gap-1.5 p-1 rounded-lg bg-white/5 border border-white/10 overflow-x-auto">
            {maps.map(m => {
              const active = m.id === selected.id
              const ma = accentFor(m.theme)
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`shrink-0 whitespace-nowrap py-2 px-3 rounded-md text-sm font-medium border transition-all duration-200 min-h-[40px] ${
                    active ? ma.switchActive : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  {m.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Endless Voyage — per-map, opens the direction picker */}
      {canVoyage && (
        <div className="px-5 pb-5">
          <button
            onClick={() => setVoyageOpen(true)}
            className="flex items-center gap-3 w-full rounded-xl p-4 bg-white/5 hover:bg-white/[0.08] border border-white/10 transition-all duration-200 min-h-[60px] text-left"
          >
            <span className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${a.badgeCurrent}`}>
              <Zap size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Endless Voyage</p>
              <p className="text-xs text-slate-400 mt-0.5">Drill {selected.name}&apos;s words — chase your best streak</p>
            </div>
            <ChevronRight size={18} className="text-slate-500 shrink-0" />
          </button>
        </div>
      )}

      {/* Heap list */}
      <div className="px-5">
        <div className="relative">
          {/* thin connector line */}
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-white/10" />

          <div className="flex flex-col gap-2.5">
            {selected.heaps.map((heap, i) => {
              const num = i + 1
              const nodeClass = heap.completed
                ? a.nodeComplete
                : heap.isCurrent
                ? a.nodeCurrent
                : heap.unlocked
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-white/5 text-slate-600 border-white/5'

              return (
                <div key={heap.id} className="relative flex items-center gap-3">
                  {/* Node */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border shrink-0 transition-all duration-200 ${nodeClass}`}
                  >
                    {heap.completed ? <Check size={16} strokeWidth={2.5} /> : heap.unlocked ? num : <Lock size={14} />}
                  </div>

                  {/* Card */}
                  {heap.unlocked ? (
                    <Link
                      href={`/heap/${heap.id}`}
                      className={`flex-1 rounded-xl p-3.5 border flex items-center gap-3 transition-all duration-200 min-h-[60px] hover:bg-white/[0.08] ${
                        heap.completed ? a.cardComplete : heap.isCurrent ? a.cardCurrent : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-tight">{heap.name}</p>
                        {heap.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{heap.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {heap.completed && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${a.badgeComplete}`}>
                              Complete
                            </span>
                          )}
                          {heap.inProgress && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium border text-amber-400 bg-amber-500/10 border-amber-500/20">
                              Loop {heap.loops_completed}/2
                            </span>
                          )}
                          {heap.isCurrent && !heap.inProgress && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${a.badgeCurrent}`}>
                              Up next
                            </span>
                          )}
                          {!heap.completed && !heap.inProgress && !heap.isCurrent && (
                            <span className="text-xs text-slate-500 font-medium">5 words · 2 loops</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-500 shrink-0" />
                    </Link>
                  ) : (
                    <div className="flex-1 rounded-xl p-3.5 border bg-white/[0.02] border-white/5 flex items-center gap-3 min-h-[60px]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-500 leading-tight">{heap.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">Complete the previous heap to unlock</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-5 mt-6">
        <div className="flex justify-around py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="text-center">
            <p className={`text-xl font-semibold ${a.text}`}>{completedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Heaps</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className={`text-xl font-semibold ${a.text}`}>{completedCount * 5}</p>
            <p className="text-xs text-slate-500 mt-0.5">Words</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className={`text-xl font-semibold ${a.text}`}>{streak}</p>
            <p className="text-xs text-slate-500 mt-0.5">Streak</p>
          </div>
        </div>
      </div>

      {/* Direction picker — bottom sheet for the selected map's Endless Voyage */}
      {voyageOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end animate-fade-in">
          {/* Backdrop */}
          <button
            aria-label="Close"
            onClick={() => setVoyageOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          {/* Sheet */}
          <div className="relative bg-slate-900 border-t border-white/10 rounded-t-2xl px-5 pt-5 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Zap size={18} className={a.text} />
                <h2 className="text-lg font-semibold text-white">Endless Voyage</h2>
              </div>
              <button
                onClick={() => setVoyageOpen(false)}
                aria-label="Close"
                className="flex items-center justify-center w-10 h-10 -mr-2 text-slate-400 hover:text-white transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">{selected.name} · pick a direction</p>

            <div className="flex flex-col gap-2.5 mb-6">
              {DIRECTION_OPTIONS.map(opt => {
                const active = direction === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setDirection(opt.id)}
                    className={`w-full text-left rounded-xl p-3.5 border transition-all duration-200 min-h-[60px] ${
                      active ? a.switchActive : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.hint}</p>
                  </button>
                )
              })}
            </div>

            <button
              onClick={startVoyage}
              className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-lg py-4 font-semibold text-base tracking-wide transition-all duration-200 min-h-[56px]"
            >
              START VOYAGE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
