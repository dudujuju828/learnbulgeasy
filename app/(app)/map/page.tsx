import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { User } from '@/lib/types'

export default async function MapPage() {
  let email = ''
  try {
    const session = await getSession()
    if (session) {
      const sql = getDb()
      const rows = await sql`SELECT email FROM users WHERE id = ${session.userId}` as Pick<User, 'email'>[]
      email = rows[0]?.email ?? ''
    }
  } catch {
    // DB not configured yet — show placeholder
  }

  return (
    <div className="flex flex-col items-center px-4 py-8 gap-6">
      <div className="text-center">
        <div className="text-6xl mb-3">🏴‍☠️</div>
        <h1 className="text-2xl font-bold text-blue-900">Your Voyage Map</h1>
        {email && (
          <p className="text-sm text-gray-500 mt-1">Welcome aboard, {email}</p>
        )}
      </div>

      <div className="w-full bg-white rounded-2xl shadow-md p-6 text-center border border-blue-100">
        <div className="text-4xl mb-3">🌊</div>
        <h2 className="text-lg font-semibold text-blue-800 mb-2">The adventure begins soon!</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Your pirate map and vocabulary heaps are being charted.
          Return once Phase 2 is complete to start your Bulgarian learning voyage.
        </p>
      </div>

      <div className="w-full grid grid-cols-3 gap-3">
        {['Food & Drink', 'Greetings', 'Numbers', 'Colors', 'Travel', 'Body'].map((theme) => (
          <div
            key={theme}
            className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100 opacity-50"
          >
            <div className="text-2xl mb-1">🔒</div>
            <p className="text-xs font-medium text-blue-700">{theme}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        10 heaps · 50 words · Your personal Bulgarian dictionary awaits
      </p>
    </div>
  )
}
