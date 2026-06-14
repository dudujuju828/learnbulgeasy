import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { HeapWord } from '@/lib/types'

type Direction = 'mixed' | 'en-bg' | 'bg-en'

function normalizeDirection(raw: string | null): Direction {
  return raw === 'en-bg' || raw === 'bg-en' ? raw : 'mixed'
}

// Returns the player's unlocked dictionary words for a single map (flattened
// across that map's completed heaps), de-duped and shuffled, plus their
// personal best streak — everything Infinite Mode needs to start a per-map run
// in one round-trip. `mapId` defaults to 1; `direction` is echoed back so the
// client can confirm the requested orientation.
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const mapId = Number(searchParams.get('mapId')) || 1
  const direction = normalizeDirection(searchParams.get('direction'))

  try {
    const sql = getDb()

    // Only words from heaps belonging to this map that the player has unlocked.
    const rows = await sql`
      SELECT d.words
      FROM dictionary d
      JOIN heaps h ON h.id = d.heap_id
      WHERE d.user_id = ${session.userId} AND h.map_id = ${mapId}
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

    return NextResponse.json({ words, best_streak: bestStreak, direction, map_id: mapId })
  } catch (err) {
    console.error('GET /api/infinite/start error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
