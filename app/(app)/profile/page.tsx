import { Zap } from 'lucide-react'
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
    <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col px-5 py-8 gap-5 animate-fade-in">
      <div className="pt-2">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Profile</h1>
        {user && (
          <p className="text-slate-400 text-sm mt-1">{user.email}</p>
        )}
      </div>

      {user && (
        <div className="w-full bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Member since</p>
          <p className="text-white text-sm font-medium">
            {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="w-full bg-white/5 rounded-xl border border-white/10 p-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Stats</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-2xl font-semibold text-emerald-400">{heapsCompleted}</p>
            <p className="text-xs text-slate-500 mt-0.5">Heaps complete</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-2xl font-semibold text-emerald-400">{wordsLearned}</p>
            <p className="text-xs text-slate-500 mt-0.5">Words learned</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-2xl font-semibold text-emerald-400">{bestStreak}</p>
            <p className="text-xs text-slate-500 mt-0.5">Best streak</p>
          </div>
        </div>
        {totalAttempts > 0 && (
          <p className="text-xs text-slate-500 text-center mt-4">
            {totalAttempts} answers submitted
          </p>
        )}
      </div>

      {/* Infinite Mode personal best */}
      <div className="w-full bg-white/5 rounded-xl border border-white/10 p-4 flex items-center gap-4">
        <span className="flex items-center justify-center w-11 h-11 rounded-lg bg-violet-500/15 text-violet-400 shrink-0">
          <Zap size={20} />
        </span>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Infinite Mode</p>
          <p className="text-2xl font-semibold text-white leading-tight mt-0.5">
            {infiniteBest} <span className="text-sm font-normal text-slate-400">best streak</span>
          </p>
        </div>
      </div>

      {heapsCompleted === 0 && (
        <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10 text-center">
          <p className="text-white text-sm font-medium">Head to the map to complete your first heap</p>
          <p className="text-slate-400 text-xs mt-1">Finish a heap twice to unlock its words</p>
        </div>
      )}
    </div>
  )
}
