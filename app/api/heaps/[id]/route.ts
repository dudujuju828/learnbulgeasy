import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { Heap, UserProgress } from '@/lib/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const sql = getDb()

    const heaps = await sql`
      SELECT id, name, description, theme, "order", words, created_at
      FROM heaps WHERE id = ${id}
    ` as Heap[]

    if (!heaps.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const progress = await sql`
      SELECT id, user_id, heap_id, completed, loops_completed, last_played, total_attempts, best_streak, created_at
      FROM user_progress
      WHERE user_id = ${session.userId} AND heap_id = ${id}
    ` as UserProgress[]

    // Determine if this heap is unlocked
    const heap = heaps[0]
    let unlocked = true
    if (heap.order > 1) {
      const prev = await sql`
        SELECT h.id, up.completed
        FROM heaps h
        LEFT JOIN user_progress up ON up.heap_id = h.id AND up.user_id = ${session.userId}
        WHERE h."order" = ${heap.order - 1}
      ` as { id: string; completed: boolean | null }[]
      unlocked = prev[0]?.completed === true
    }

    const nextHeaps = await sql`
      SELECT id FROM heaps WHERE "order" = ${heap.order + 1}
    ` as { id: string }[]
    const nextHeapId = nextHeaps[0]?.id ?? null

    return NextResponse.json({
      heap,
      progress: progress[0] ?? null,
      unlocked,
      nextHeapId,
    })
  } catch (err) {
    console.error('GET /api/heaps/[id] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
