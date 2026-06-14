import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { User, UserProgress } from '@/lib/types'

export default async function ProfilePage() {
  let user: Pick<User, 'email' | 'created_at'> | null = null
  let heapsCompleted = 0
  let totalAttempts = 0
  let bestStreak = 0
  let wordsLearned = 0

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
    }
  } catch {
    // DB not configured
  }

  return (
    <div className="flex flex-col items-center px-4 py-8 gap-4">
      <div className="text-6xl">🏴‍☠️</div>
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
          <div className="bg-yellow-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-yellow-700">{wordsLearned}</p>
            <p className="text-xs text-gray-500 mt-0.5">Words learned</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-green-700">{bestStreak}</p>
            <p className="text-xs text-gray-500 mt-0.5">Best streak</p>
          </div>
        </div>
        {totalAttempts > 0 && (
          <p className="text-xs text-gray-400 text-center mt-3">
            {totalAttempts} total answers submitted
          </p>
        )}
      </div>

      {heapsCompleted === 0 && (
        <div className="w-full bg-yellow-50 rounded-2xl p-4 border border-yellow-200 text-center">
          <p className="text-yellow-800 text-sm font-medium">Start on the Map to complete your first heap!</p>
          <p className="text-yellow-600 text-xs mt-1">Complete a heap twice to unlock words</p>
        </div>
      )}
    </div>
  )
}
