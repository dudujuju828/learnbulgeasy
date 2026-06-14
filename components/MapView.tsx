'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Lock, ChevronRight, Zap } from 'lucide-react'

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
}

const accentFor = (theme: string): Accent => {
  if (theme === 'straits') return ACCENTS.violet
  if (theme === 'volcano') return ACCENTS.orange
  return ACCENTS.emerald
}

export default function MapView({ maps, initialMapId }: { maps: MapData[]; initialMapId: number }) {
  const [selectedId, setSelectedId] = useState(initialMapId)

  // Empty state — DB not connected / not migrated
  if (maps.length === 0) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 px-5 pt-12">
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

  // Endless Voyage available once anything is completed anywhere
  const anyCompleted = maps.some(m => m.heaps.some(h => h.completed))

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 pb-10 animate-fade-in">
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
          <div className="flex gap-1.5 p-1 rounded-lg bg-white/5 border border-white/10">
            {maps.map(m => {
              const active = m.id === selected.id
              const ma = accentFor(m.theme)
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-all duration-200 min-h-[40px] ${
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

      {/* Endless Voyage */}
      {anyCompleted && (
        <div className="px-5 pb-5">
          <Link
            href="/infinite"
            className="flex items-center gap-3 w-full rounded-xl p-4 bg-white/5 hover:bg-white/[0.08] border border-white/10 transition-all duration-200 min-h-[60px]"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/15 text-violet-400 shrink-0">
              <Zap size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Infinite Mode</p>
              <p className="text-xs text-slate-400 mt-0.5">Drill your words — chase your best streak</p>
            </div>
            <ChevronRight size={18} className="text-slate-500 shrink-0" />
          </Link>
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
    </div>
  )
}
