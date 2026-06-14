import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { Heap, UserProgress } from '@/lib/types'

const THEME_EMOJI: Record<string, string> = {
  Greetings: '👋', Numbers: '🔢', Food: '🍞', Colors: '🎨',
  Family: '👨‍👩‍👧', Body: '💪', Time: '⏰', Travel: '✈️',
  Verbs: '⚡', Emotions: '😊', Places: '🏔️', Objects: '🏠',
  Weather: '☀️', Animals: '🐾', Clothes: '👕', Adjectives: '✨',
  Actions: '🎯',
}

export default async function MapPage() {
  const session = await getSession()

  let heapsWithProgress: {
    heap: Heap
    progress: Pick<UserProgress, 'completed' | 'loops_completed'> | null
    unlocked: boolean
  }[] = []

  try {
    if (session) {
      const sql = getDb()

      const heaps = await sql`
        SELECT id, name, description, theme, "order", words, created_at
        FROM heaps ORDER BY "order" ASC
      ` as Heap[]

      const progress = await sql`
        SELECT heap_id, completed, loops_completed
        FROM user_progress WHERE user_id = ${session.userId}
      ` as (Pick<UserProgress, 'completed' | 'loops_completed'> & { heap_id: string })[]

      const progressMap = new Map(progress.map(p => [p.heap_id, p]))

      heapsWithProgress = heaps.map((heap, index) => {
        const prev = index > 0 ? heaps[index - 1] : null
        const prevProg = prev ? progressMap.get(prev.id) : null
        const unlocked = index === 0 || prevProg?.completed === true
        return { heap, progress: progressMap.get(heap.id) ?? null, unlocked }
      })
    }
  } catch {
    // DB not configured — show empty state
  }

  let streak = 0
  for (const { progress } of heapsWithProgress) {
    if (progress?.completed) streak++
    else break
  }

  const completedCount = heapsWithProgress.filter(h => h.progress?.completed).length
  const currentIndex = heapsWithProgress.findIndex(h => h.unlocked && !h.progress?.completed)

  return (
    <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 pb-8">
      {/* Stars */}
      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none select-none overflow-hidden">
        <span className="absolute top-4 left-6 text-yellow-100/50 text-[10px]">✦</span>
        <span className="absolute top-8 left-1/4 text-yellow-200/40 text-xs">★</span>
        <span className="absolute top-3 right-10 text-yellow-100/60 text-xs">★</span>
        <span className="absolute top-12 right-1/4 text-yellow-200/30 text-[10px]">✦</span>
      </div>

      {/* Header */}
      <div className="relative px-4 pt-8 pb-4 text-center">
        <div className="text-5xl mb-2 animate-float inline-block">🧭</div>
        <h1 className="font-pirata text-4xl text-yellow-300 tracking-wide drop-shadow-lg">Voyage Map</h1>
        <p className="text-blue-300/80 text-sm mt-1">Navigate the seas of Bulgarian</p>

        {streak > 0 && (
          <div className="inline-flex items-center gap-1.5 mt-3 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-yellow-900/40">
            <span>🔥</span>
            <span>{streak} island{streak !== 1 ? 's' : ''} conquered!</span>
          </div>
        )}
      </div>

      {/* Animated ocean waves */}
      <div className="overflow-hidden h-6 mb-4 select-none">
        <div className="text-blue-400/30 text-2xl whitespace-nowrap animate-wave">
          ～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～
        </div>
      </div>

      {heapsWithProgress.length === 0 ? (
        <div className="mx-4 bg-blue-900/40 rounded-2xl p-6 text-center border border-blue-600/30 backdrop-blur-sm">
          <div className="text-4xl mb-3 animate-float inline-block">⚓</div>
          <h2 className="font-pirata text-2xl text-yellow-300 mb-2">Seas Uncharted</h2>
          <p className="text-sm text-blue-300">
            Database not connected. Deploy to Vercel and run migrations to begin your voyage.
          </p>
        </div>
      ) : (
        <div className="relative px-4">
          {/* Gold rope path */}
          <div className="absolute left-[36px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-yellow-500/25 z-0" />

          <div className="flex flex-col gap-0">
            {heapsWithProgress.map(({ heap, progress, unlocked }, index) => {
              const completed = progress?.completed === true
              const inProgress = !completed && (progress?.loops_completed ?? 0) > 0
              const isCurrent = index === currentIndex
              const emoji = THEME_EMOJI[heap.theme] ?? '📦'

              // Node icons: treasure chest metaphor
              const nodeIcon = completed ? '💰' : isCurrent ? '🚢' : unlocked ? '⚓' : '🔒'
              const nodeClass = completed
                ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 animate-treasure-glow'
                : isCurrent
                ? 'bg-gradient-to-br from-blue-400 to-blue-500 border-blue-200 animate-current-pulse'
                : unlocked
                ? 'bg-blue-800 border-blue-600'
                : 'bg-blue-950 border-blue-800 opacity-50'

              return (
                <div key={heap.id} className="relative flex items-start gap-3 pb-3">
                  {/* Node */}
                  <div className="relative z-10 flex flex-col items-center w-9 pt-0.5 shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-lg border-2 transition-all ${nodeClass}`}>
                      {nodeIcon}
                    </div>
                  </div>

                  {/* Heap card */}
                  {unlocked ? (
                    <Link
                      href={`/heap/${heap.id}`}
                      className={`flex-1 rounded-2xl p-3.5 border flex items-center gap-3 active:scale-95 transition-all min-h-[60px] ${
                        completed
                          ? 'bg-yellow-400/10 border-yellow-500/25 shadow-sm shadow-yellow-900/20'
                          : isCurrent
                          ? 'bg-blue-500/20 border-blue-400/40 shadow-lg shadow-blue-950/60'
                          : 'bg-blue-900/30 border-blue-700/30'
                      }`}
                    >
                      <span className={`text-2xl shrink-0 ${!completed && !isCurrent ? 'opacity-50' : ''}`}>
                        {emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm leading-tight ${
                          completed ? 'text-yellow-300'
                          : isCurrent ? 'text-white'
                          : 'text-blue-200'
                        }`}>
                          {heap.name}
                        </p>
                        {heap.description && (
                          <p className="text-xs text-blue-400/70 mt-0.5 truncate">{heap.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {completed && (
                            <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-500/25 px-2 py-0.5 rounded-full font-medium">
                              ✓ Plundered
                            </span>
                          )}
                          {inProgress && (
                            <span className="text-xs text-blue-300 bg-blue-400/15 border border-blue-400/25 px-2 py-0.5 rounded-full font-medium">
                              Loop {progress!.loops_completed}/2
                            </span>
                          )}
                          {isCurrent && !inProgress && (
                            <span className="text-xs text-blue-200 bg-blue-400/15 border border-blue-300/25 px-2 py-0.5 rounded-full font-medium">
                              ▶ Next island
                            </span>
                          )}
                          {!completed && !inProgress && !isCurrent && (
                            <span className="text-xs text-blue-500 font-medium">5 words · 2 loops</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-base shrink-0 ${completed ? 'text-yellow-400' : 'text-blue-500'}`}>›</span>
                    </Link>
                  ) : (
                    <div className="flex-1 rounded-2xl p-3.5 border bg-blue-950/40 border-blue-800/30 flex items-center gap-3 opacity-35 min-h-[60px]">
                      <span className="text-2xl grayscale">🔒</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-blue-400 text-sm">{heap.name}</p>
                        <p className="text-xs text-blue-600 mt-0.5">Conquer previous island to unlock</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Second wave divider */}
      <div className="overflow-hidden h-5 my-4 select-none">
        <div className="text-blue-500/20 text-2xl whitespace-nowrap" style={{ animation: 'wave-scroll 12s linear infinite reverse' }}>
          ～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～
        </div>
      </div>

      {/* Stats bar */}
      {heapsWithProgress.length > 0 && (
        <div className="mx-4">
          <div className="flex justify-around py-4 bg-blue-950/60 rounded-2xl border border-blue-700/30 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-300">{completedCount}</p>
              <p className="text-xs text-blue-400 mt-0.5">🏝️ Islands</p>
            </div>
            <div className="w-px bg-blue-800/60" />
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-300">{completedCount * 5}</p>
              <p className="text-xs text-blue-400 mt-0.5">💰 Words</p>
            </div>
            <div className="w-px bg-blue-800/60" />
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-300">{streak > 0 ? `🔥${streak}` : '—'}</p>
              <p className="text-xs text-blue-400 mt-0.5">🔥 Streak</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
