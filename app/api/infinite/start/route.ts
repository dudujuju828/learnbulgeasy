import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { HeapWord } from '@/lib/types'

// Returns the player's unlocked dictionary words (flattened across all
// completed heaps), de-duped and shuffled, plus their personal best streak —
// everything Infinite Mode needs to start a run in one round-trip.
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    const rows = await sql`
      SELECT words FROM dictionary WHERE user_id = ${session.userId}
    ` as { words: HeapWord[] }[]

    const seen = new Set<string>()
    const words: HeapWord[] = []
    for (const row of rows) {
      for (const w of row.words) {
        const key = `${w.en}|${w.bg}`
        if (seen.has(key)) continue
        seen.add(key)
        words.push(w)
      }
    }

    // Fisher-Yates shuffle
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[words[i], words[j]] = [words[j], words[i]]
    }

    // Best streak — tolerate the column not existing yet (pre-migration).
    let bestStreak = 0
    try {
      const userRows = await sql`
        SELECT infinite_best_streak FROM users WHERE id = ${session.userId}
      ` as { infinite_best_streak: number | null }[]
      bestStreak = Number(userRows[0]?.infinite_best_streak ?? 0)
    } catch {
      bestStreak = 0
    }

    return NextResponse.json({ words, best_streak: bestStreak })
  } catch (err) {
    console.error('GET /api/infinite/start error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
