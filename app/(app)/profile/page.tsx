import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { User, UserProgress } from '@/lib/types'

export default async function ProfilePage() {
  let user: Pick<User, 'email' | 'created_at'> | null = null
  let heapsCompleted = 0
  let totalAttempts = 0
  let bestStreak = 0

  try {
    const session = await getSession()
    if (session) {
      const sql = getDb()

      const rows = await sql`
        SELECT email, created_at FROM users WHERE id = ${session.userId}
      ` as Pick<User, 'email' | 'created_at'>[]
      user = rows[0] ?? null

      const progress = await sql`
        SELECT completed, total_attempts, best_streak FROM user_progress WHERE user_id = ${session.userId}
      ` as Pick<UserProgress, 'completed' | 'total_attempts' | 'best_streak'>[]

      heapsCompleted = progress.filter(p => p.completed).length
      totalAttempts = progress.reduce((sum, p) => sum + p.total_attempts, 0)
      bestStreak = Math.max(0, ...progress.map(p => p.best_streak))
    }
  } catch {
    // DB not configured
  }

  return (
    <div className="flex flex-col items-center px-4 py-8 gap-4">
      <div className="text-6xl">👤</div>
      <h1 className="text-2xl font-bold text-blue-900">Your Profile</h1>

      {user && (
        <div className="w-full bg-white rounded-2xl shadow-md p-4 border border-blue-100 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
            <p className="text-sm font-medium text-gray-800">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Member since</p>
            <p className="text-sm font-medium text-gray-800">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <div className="w-full bg-white rounded-2xl shadow-md p-4 border border-blue-100">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Stats</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-blue-900">{heapsCompleted}</p>
            <p className="text-xs text-gray-500 mt-0.5">Heaps done</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-blue-900">{heapsCompleted * 5}</p>
            <p className="text-xs text-gray-500 mt-0.5">Words learned</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-blue-900">{bestStreak}</p>
            <p className="text-xs text-gray-500 mt-0.5">Best streak</p>
          </div>
        </div>
        {totalAttempts > 0 && (
          <p className="text-xs text-gray-400 text-center mt-3">
            {totalAttempts} total answers submitted
          </p>
        )}
      </div>
    </div>
  )
}
