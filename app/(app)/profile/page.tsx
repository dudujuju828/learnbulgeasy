import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { User } from '@/lib/types'

export default async function ProfilePage() {
  let user: Pick<User, 'email' | 'created_at'> | null = null
  try {
    const session = await getSession()
    if (session) {
      const sql = getDb()
      const rows = await sql`SELECT email, created_at FROM users WHERE id = ${session.userId}` as Pick<User, 'email' | 'created_at'>[]
      user = rows[0] ?? null
    }
  } catch {
    // DB not configured yet
  }

  return (
    <div className="flex flex-col items-center px-4 py-8 gap-4">
      <div className="text-6xl">👤</div>
      <h1 className="text-2xl font-bold text-blue-900">Your Profile</h1>
      {user && (
        <div className="w-full bg-white rounded-2xl shadow-md p-6 border border-blue-100 space-y-3">
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
      <div className="w-full bg-white rounded-2xl shadow-md p-6 border border-blue-100 space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Stats</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Heaps completed</span>
          <span className="font-bold text-blue-700">0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Words learned</span>
          <span className="font-bold text-blue-700">0</span>
        </div>
      </div>
    </div>
  )
}
