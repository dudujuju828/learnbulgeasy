import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

interface SyncItem {
  heap_id: string
  loops_completed: number
  total_attempts: number
  best_streak: number
  completed: boolean
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { items: SyncItem[] }
  const { items } = body

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

  const sql = getDb()
  let synced = 0

  for (const item of items) {
    try {
      await sql`
        INSERT INTO user_progress (user_id, heap_id, completed, loops_completed, last_played, total_attempts, best_streak)
        VALUES (${session.userId}, ${item.heap_id}, ${item.completed}, ${item.loops_completed}, NOW(), ${item.total_attempts}, ${item.best_streak})
        ON CONFLICT (user_id, heap_id) DO UPDATE SET
          completed = GREATEST(user_progress.completed::int, EXCLUDED.completed::int)::boolean,
          loops_completed = GREATEST(user_progress.loops_completed, EXCLUDED.loops_completed),
          last_played = NOW(),
          total_attempts = user_progress.total_attempts + EXCLUDED.total_attempts,
          best_streak = GREATEST(user_progress.best_streak, EXCLUDED.best_streak)
      `

      if (item.completed) {
        const existing = await sql`
          SELECT id FROM dictionary WHERE user_id = ${session.userId} AND heap_id = ${item.heap_id}
        ` as { id: string }[]

        if (!existing.length) {
          const heaps = await sql`SELECT words FROM heaps WHERE id = ${item.heap_id}` as { words: unknown }[]
          if (heaps.length) {
            await sql`
              INSERT INTO dictionary (user_id, heap_id, words)
              VALUES (${session.userId}, ${item.heap_id}, ${JSON.stringify(heaps[0].words)}::jsonb)
              ON CONFLICT DO NOTHING
            `
          }
        }
      }

      synced++
    } catch (err) {
      console.error(`Sync failed for heap ${item.heap_id}:`, err)
    }
  }

  return NextResponse.json({ synced })
}
