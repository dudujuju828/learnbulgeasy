import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { Heap, UserProgress } from '@/lib/types'

const THEME_EMOJI: Record<string, string> = {
  Greetings: '👋', Numbers: '🔢', Food: '🍞', Colors: '🎨',
  Family: '👨‍👩‍👧', Body: '💪', Time: '⏰', Travel: '✈️',
  Verbs: '⚡', Emotions: '😊',
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

  // Consecutive completed heaps from the start = streak
  let streak = 0
  for (const { progress } of heapsWithProgress) {
    if (progress?.completed) streak++
    else break
  }

  const completedCount = heapsWithProgress.filter(h => h.progress?.completed).length
  // Index of the current heap (first unlocked, not completed)
  const currentIndex = heapsWithProgress.findIndex(h => h.unlocked && !h.progress?.completed)

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 text-center">
        <div className="text-4xl mb-1">🧭</div>
        <h1 className="text-2xl font-bold text-yellow-300 tracking-wide">Voyage Map</h1>
        <p className="text-blue-300 text-sm mt-0.5">Navigate the seas of Bulgarian</p>

        {streak > 0 && (
          <div className="inline-flex items-center gap-1.5 mt-3 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-yellow-900/30">
            <span>🔥</span>
            <span>{streak} heap{streak !== 1 ? 's' : ''} in a row!</span>
          </div>
        )}
      </div>

      {/* Wave divider */}
      <div className="text-blue-600 text-center text-xl leading-none px-4 mb-5 select-none opacity-60">
        ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈
      </div>

      {heapsWithProgress.length === 0 ? (
        <div className="mx-4 bg-blue-800/40 rounded-2xl p-6 text-center border border-blue-600/50 backdrop-blur-sm">
          <div className="text-4xl mb-3">⚓</div>
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">Voyage not yet charted</h2>
          <p className="text-sm text-blue-300">
            Database not connected. Deploy to Vercel and run migrations to begin your journey.
          </p>
        </div>
      ) : (
        <div className="relative px-4">
          {/* Dashed rope path down the left */}
          <div className="absolute left-[36px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-yellow-500/30 z-0" />

          <div className="flex flex-col gap-0">
            {heapsWithProgress.map(({ heap, progress, unlocked }, index) => {
              const completed = progress?.completed === true
              const inProgress = !completed && (progress?.loops_completed ?? 0) > 0
              const isCurrent = index === currentIndex
              const emoji = THEME_EMOJI[heap.theme] ?? '📦'

              return (
                <div key={heap.id} className="relative flex items-start gap-3 pb-3">
                  {/* Node marker */}
                  <div className="relative z-10 flex flex-col items-center w-9 pt-0.5 shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shadow-lg border-2 transition-all ${
                      completed
                        ? 'bg-yellow-400 border-yellow-300 shadow-yellow-500/30'
                        : isCurrent
                        ? 'bg-blue-400 border-blue-200 shadow-blue-400/40 ring-2 ring-blue-300/50 ring-offset-1 ring-offset-blue-900'
                        : unlocked
                        ? 'bg-blue-700 border-blue-500'
                        : 'bg-blue-950 border-blue-800'
                    }`}>
                      <span className="text-sm leading-none">
                        {completed ? '⭐' : isCurrent ? '🚢' : unlocked ? '⚓' : '🔒'}
                      </span>
                    </div>
                  </div>

                  {/* Heap card */}
                  {unlocked ? (
                    <Link
                      href={`/heap/${heap.id}`}
                      className={`flex-1 rounded-2xl p-3.5 border flex items-center gap-3 active:scale-95 transition-all ${
                        completed
                          ? 'bg-yellow-400/10 border-yellow-500/30'
                          : isCurrent
                          ? 'bg-blue-500/20 border-blue-400/50 shadow-lg shadow-blue-900/40'
                          : 'bg-blue-800/30 border-blue-600/30'
                      }`}
                    >
                      <span className={`text-2xl shrink-0 ${!completed && !isCurrent ? 'opacity-60' : ''}`}>
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
                          <p className="text-xs text-blue-400/80 mt-0.5 truncate">{heap.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {completed && (
                            <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-500/30 px-2 py-0.5 rounded-full font-medium">
                              ✓ Complete
                            </span>
                          )}
                          {inProgress && (
                            <span className="text-xs text-blue-300 bg-blue-400/15 border border-blue-400/30 px-2 py-0.5 rounded-full font-medium">
                              Loop {progress!.loops_completed}/2
                            </span>
                          )}
                          {isCurrent && !inProgress && (
                            <span className="text-xs text-blue-200 bg-blue-400/15 border border-blue-300/30 px-2 py-0.5 rounded-full font-medium">
                              ▶ Next stop
                            </span>
                          )}
                          {!completed && !inProgress && !isCurrent && (
                            <span className="text-xs text-blue-500 font-medium">5 words · 2 loops</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-lg shrink-0 ${completed ? 'text-yellow-400' : 'text-blue-500'}`}>›</span>
                    </Link>
                  ) : (
                    <div className="flex-1 rounded-2xl p-3.5 border bg-blue-950/50 border-blue-800/40 flex items-center gap-3 opacity-40">
                      <span className="text-2xl grayscale">🔒</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-blue-400 text-sm">{heap.name}</p>
                        <p className="text-xs text-blue-600 mt-0.5">Complete previous heap to unlock</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats bar */}
      {heapsWithProgress.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="flex justify-around py-4 bg-blue-950/60 rounded-2xl border border-blue-700/40 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-300">{completedCount}</p>
              <p className="text-xs text-blue-400 mt-0.5">Heaps done</p>
            </div>
            <div className="w-px bg-blue-700/50" />
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-300">{completedCount * 5}</p>
              <p className="text-xs text-blue-400 mt-0.5">Words learned</p>
            </div>
            <div className="w-px bg-blue-700/50" />
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-300">{streak > 0 ? `🔥${streak}` : '—'}</p>
              <p className="text-xs text-blue-400 mt-0.5">Streak</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
