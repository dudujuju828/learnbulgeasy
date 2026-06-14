import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { DictionaryEntry, Heap } from '@/lib/types'

export default async function DictionaryPage() {
  const session = await getSession()

  let entries: (DictionaryEntry & { heap_name: string })[] = []

  try {
    if (session) {
      const sql = getDb()
      const rows = await sql`
        SELECT d.id, d.user_id, d.heap_id, d.words, d.unlocked_at, h.name as heap_name
        FROM dictionary d
        JOIN heaps h ON h.id = d.heap_id
        WHERE d.user_id = ${session.userId}
        ORDER BY d.unlocked_at DESC
      ` as (DictionaryEntry & { heap_name: string })[]
      entries = rows
    }
  } catch {
    // DB not configured
  }

  const totalWords = entries.reduce((sum, e) => sum + e.words.length, 0)

  return (
    <div className="flex flex-col px-4 py-6 gap-4">
      <div className="text-center">
        <div className="text-5xl mb-2">📖</div>
        <h1 className="text-2xl font-bold text-blue-900">Your Dictionary</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalWords > 0 ? `${totalWords} words unlocked` : 'Complete heaps to add words'}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="w-full bg-white rounded-2xl shadow-md p-6 text-center border border-blue-100">
          <p className="text-gray-400 text-sm">
            No words yet. Complete a heap on the Map to unlock your first 5 words!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="bg-blue-900 px-4 py-2">
                <p className="text-white font-semibold text-sm">{entry.heap_name}</p>
                <p className="text-blue-300 text-xs">{entry.words.length} words</p>
              </div>
              {entry.words.map((word) => (
                <div
                  key={word.en}
                  className="flex items-center justify-between px-4 py-3 border-b border-blue-50 last:border-0"
                >
                  <span className="text-gray-700 text-sm font-medium">{word.en}</span>
                  <div className="text-right">
                    <div className="text-blue-800 font-bold text-sm">{word.bg}</div>
                    {word.cyr && <div className="text-gray-400 text-xs">{word.cyr}</div>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
