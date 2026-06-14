import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { DictionaryEntry } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT d.id, d.user_id, d.heap_id, d.words, d.unlocked_at, h.name as heap_name
      FROM dictionary d
      JOIN heaps h ON h.id = d.heap_id
      WHERE d.user_id = ${session.userId}
      ORDER BY d.unlocked_at DESC
    ` as (DictionaryEntry & { heap_name: string })[]

    return NextResponse.json({ entries: rows })
  } catch (err) {
    console.error('GET /api/dictionary error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
