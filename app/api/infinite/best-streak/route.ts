import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

// GET → the player's current personal best streak.
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT infinite_best_streak FROM users WHERE id = ${session.userId}
    ` as { infinite_best_streak: number | null }[]
    return NextResponse.json({ best_streak: Number(rows[0]?.infinite_best_streak ?? 0) })
  } catch (err) {
    console.error('GET /api/infinite/best-streak error:', err)
    return NextResponse.json({ best_streak: 0 })
  }
}

// POST → record the outcome of a finished run. Bumps the user's best streak
// (only ever upward) and logs the attempt for stats. Body: { streak,
// words_seen, accuracy }.
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const streak = Math.max(0, Math.floor(Number(body.streak) || 0))
    const wordsSeen = Math.max(0, Math.floor(Number(body.words_seen) || 0))
    const accuracy = Math.min(100, Math.max(0, Math.round(Number(body.accuracy) || 0)))

    const sql = getDb()

    const rows = await sql`
      UPDATE users
      SET infinite_best_streak = GREATEST(COALESCE(infinite_best_streak, 0), ${streak})
      WHERE id = ${session.userId}
      RETURNING infinite_best_streak
    ` as { infinite_best_streak: number }[]

    // Attempt log is best-effort — never block the streak save on it.
    try {
      await sql`
        INSERT INTO infinite_attempts (user_id, streak, words_seen, accuracy)
        VALUES (${session.userId}, ${streak}, ${wordsSeen}, ${accuracy})
      `
    } catch (logErr) {
      console.warn('infinite_attempts log failed:', logErr)
    }

    return NextResponse.json({ best_streak: Number(rows[0]?.infinite_best_streak ?? streak) })
  } catch (err) {
    console.error('POST /api/infinite/best-streak error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
