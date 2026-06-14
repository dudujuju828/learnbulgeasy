import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { User, UserProgress } from '@/lib/types'

export default async function ProfilePage() {
  let user: Pick<User, 'email' | 'created_at'> | null = null
  let heapsCompleted = 0
  let totalAttempts = 0
  let bestStreak = 0
  let wordsLearned = 0
  let infiniteBest = 0

  try {
    const session = await getSession()
    if (session) {
      const sql = getDb()

      const userRows = await sql`
        SELECT email, created_at FROM users WHERE id = ${session.userId}
      ` as Pick<User, 'email' | 'created_at'>[]
      user = userRows[0] ?? null

      const progress = await sql`
        SELECT completed, total_attempts, best_streak FROM user_progress WHERE user_id = ${session.userId}
      ` as Pick<UserProgress, 'completed' | 'total_attempts' | 'best_streak'>[]

      heapsCompleted = progress.filter(p => p.completed).length
      totalAttempts = progress.reduce((sum, p) => sum + p.total_attempts, 0)
      bestStreak = Math.max(0, ...progress.map(p => p.best_streak))

      const wordRows = await sql`
        SELECT COALESCE(SUM(jsonb_array_length(words)), 0) as count
        FROM dictionary WHERE user_id = ${session.userId}
      ` as { count: number }[]
      wordsLearned = Number(wordRows[0]?.count ?? 0)

      // Tolerate the column not existing yet (pre-migration) so the rest of the
      // stats still render.
      try {
        const infRows = await sql`
          SELECT infinite_best_streak FROM users WHERE id = ${session.userId}
        ` as { infinite_best_streak: number | null }[]
        infiniteBest = Number(infRows[0]?.infinite_best_streak ?? 0)
      } catch {
        infiniteBest = 0
      }
    }
  } catch {
    // DB not configured
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 flex flex-col items-center px-4 py-8 gap-5">
      <div className="text-center">
        <div className="text-6xl mb-2 animate-float inline-block">🏴‍☠️</div>
        <h1 className="font-pirata text-4xl text-yellow-300 tracking-wide">Captain&apos;s Quarters</h1>
        {user && (
          <p className="text-blue-300 text-sm mt-1">{user.email}</p>
        )}
      </div>

      {user && (
        <div className="w-full bg-blue-950/60 rounded-2xl border border-blue-700/30 p-4">
          <p className="text-xs text-yellow-400/60 uppercase tracking-wider font-semibold mb-2">⚓ Voyage started</p>
          <p className="text-blue-200 text-sm font-medium">
            {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="w-full bg-blue-950/60 rounded-2xl border border-blue-700/30 p-4">
        <p className="text-xs text-yellow-400/60 uppercase tracking-wider font-semibold mb-4">📊 Voyage Log</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-900/50 rounded-xl p-3 border border-blue-700/25">
            <p className="text-2xl font-bold text-yellow-300">{heapsCompleted}</p>
            <p className="text-xs text-blue-400 mt-0.5">🏝️ Islands</p>
          </div>
          <div className="bg-amber-900/30 rounded-xl p-3 border border-yellow-700/20">
            <p className="text-2xl font-bold text-yellow-300">{wordsLearned}</p>
            <p className="text-xs text-blue-400 mt-0.5">💰 Words</p>
          </div>
          <div className="bg-blue-900/50 rounded-xl p-3 border border-blue-700/25">
            <p className="text-2xl font-bold text-yellow-300">{bestStreak}</p>
            <p className="text-xs text-blue-400 mt-0.5">🔥 Best run</p>
          </div>
        </div>
        {totalAttempts > 0 && (
          <p className="text-xs text-blue-500 text-center mt-4">
            ⚔️ {totalAttempts} battles fought
          </p>
        )}
      </div>

      {/* Endless Voyage personal best */}
      <div className="w-full bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-2xl border border-purple-500/30 p-4 flex items-center gap-4">
        <span className="text-4xl shrink-0">⚡</span>
        <div className="flex-1">
          <p className="text-xs text-purple-300/70 uppercase tracking-wider font-semibold">Endless Voyage</p>
          <p className="text-2xl font-bold text-yellow-300 leading-tight">
            {infiniteBest} <span className="text-sm font-normal text-indigo-300">best streak</span>
          </p>
        </div>
      </div>

      {heapsCompleted === 0 && (
        <div className="w-full bg-amber-900/20 rounded-2xl p-4 border border-yellow-700/20 text-center">
          <p className="text-yellow-300 text-sm font-medium">Set sail on the Map to conquer your first island!</p>
          <p className="text-blue-400 text-xs mt-1">Complete a heap twice to unlock words</p>
        </div>
      )}
    </div>
  )
}
