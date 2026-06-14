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

  return (
    <div className="flex flex-col px-4 py-6 gap-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-2">🗺️</div>
        <h1 className="text-2xl font-bold text-blue-900">Your Voyage Map</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete heaps to unlock more words
        </p>
      </div>

      {heapsWithProgress.length === 0 ? (
        <div className="w-full bg-white rounded-2xl shadow-md p-6 text-center border border-blue-100">
          <div className="text-4xl mb-3">🌊</div>
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Voyage not yet charted</h2>
          <p className="text-sm text-gray-500">
            Database not connected. Deploy to Vercel and run migrations to begin.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {heapsWithProgress.map(({ heap, progress, unlocked }, index) => {
            const completed = progress?.completed === true
            const inProgress = !completed && (progress?.loops_completed ?? 0) > 0
            const emoji = THEME_EMOJI[heap.theme] ?? '📦'

            return (
              <div key={heap.id} className="flex items-stretch gap-3">
                {/* Timeline connector */}
                <div className="flex flex-col items-center w-8 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow shrink-0 ${
                    completed ? 'bg-green-500 text-white' :
                    unlocked ? 'bg-blue-900 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {completed ? '✓' : index + 1}
                  </div>
                  {index < heapsWithProgress.length - 1 && (
                    <div className={`w-0.5 flex-1 mt-1 ${completed ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>

                {/* Heap card */}
                {unlocked ? (
                  <Link
                    href={`/heap/${heap.id}`}
                    className={`flex-1 rounded-2xl p-4 border flex items-center gap-3 active:scale-95 transition-transform mb-3 ${
                      completed
                        ? 'bg-green-50 border-green-200'
                        : inProgress
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-white border-blue-100 shadow-sm'
                    }`}
                  >
                    <span className="text-3xl">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-blue-900 text-sm leading-tight">{heap.name}</p>
                      {heap.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{heap.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {completed && (
                          <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full font-medium">
                            ✓ Complete
                          </span>
                        )}
                        {inProgress && (
                          <span className="text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded-full font-medium">
                            Loop {progress!.loops_completed}/2 done
                          </span>
                        )}
                        {!completed && !inProgress && (
                          <span className="text-xs text-blue-600 font-medium">5 words · 2 loops</span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-300 text-lg">›</span>
                  </Link>
                ) : (
                  <div className="flex-1 rounded-2xl p-4 border bg-gray-50 border-gray-200 flex items-center gap-3 mb-3 opacity-60">
                    <span className="text-3xl grayscale">🔒</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-400 text-sm">{heap.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Complete the previous heap to unlock</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Stats footer */}
      {heapsWithProgress.length > 0 && (
        <div className="flex justify-around py-3 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="text-center">
            <p className="text-xl font-bold text-blue-900">
              {heapsWithProgress.filter(h => h.progress?.completed).length}
            </p>
            <p className="text-xs text-gray-500">Heaps done</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-900">
              {heapsWithProgress.filter(h => h.progress?.completed).length * 5}
            </p>
            <p className="text-xs text-gray-500">Words learned</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-900">
              {heapsWithProgress.length - heapsWithProgress.filter(h => h.progress?.completed).length}
            </p>
            <p className="text-xs text-gray-500">Remaining</p>
          </div>
        </div>
      )}
    </div>
  )
}
