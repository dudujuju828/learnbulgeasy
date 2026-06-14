import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { Heap, UserProgress } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json() as {
    loops_completed: number
    total_attempts: number
    best_streak: number
    completed: boolean
  }

  const { loops_completed, total_attempts, best_streak, completed } = body

  try {
    const sql = getDb()

    // Upsert user_progress
    const updated = await sql`
      INSERT INTO user_progress (user_id, heap_id, completed, loops_completed, last_played, total_attempts, best_streak)
      VALUES (${session.userId}, ${id}, ${completed}, ${loops_completed}, NOW(), ${total_attempts}, ${best_streak})
      ON CONFLICT (user_id, heap_id) DO UPDATE SET
        completed = GREATEST(user_progress.completed::int, EXCLUDED.completed::int)::boolean,
        loops_completed = GREATEST(user_progress.loops_completed, EXCLUDED.loops_completed),
        last_played = NOW(),
        total_attempts = user_progress.total_attempts + EXCLUDED.total_attempts,
        best_streak = GREATEST(user_progress.best_streak, EXCLUDED.best_streak)
      RETURNING id, user_id, heap_id, completed, loops_completed, last_played, total_attempts, best_streak, created_at
    ` as UserProgress[]

    // Unlock dictionary if just completed
    if (completed) {
      const existing = await sql`
        SELECT id FROM dictionary WHERE user_id = ${session.userId} AND heap_id = ${id}
      ` as { id: string }[]

      if (!existing.length) {
        const heaps = await sql`SELECT words FROM heaps WHERE id = ${id}` as Pick<Heap, 'words'>[]
        if (heaps.length) {
          await sql`
            INSERT INTO dictionary (user_id, heap_id, words)
            VALUES (${session.userId}, ${id}, ${JSON.stringify(heaps[0].words)}::jsonb)
          `
        }
      }
    }

    return NextResponse.json({ progress: updated[0] })
  } catch (err) {
    console.error('POST /api/heaps/[id]/progress error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
