import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { DictionaryEntry } from '@/lib/types'
import DictionaryClient from '@/components/DictionaryClient'

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

  return <DictionaryClient entries={entries} />
}
