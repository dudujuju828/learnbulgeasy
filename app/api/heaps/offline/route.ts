import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { Heap, UserProgress } from '@/lib/types'

// Returns every heap with full vocab + the user's progress + unlock/next info,
// so the client can seed IndexedDB for complete offline gameplay.
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    const heaps = await sql`
      SELECT id, name, description, theme, "order", words, created_at
      FROM heaps
      ORDER BY "order" ASC
    ` as Heap[]

    const progress = await sql`
      SELECT id, user_id, heap_id, completed, loops_completed, last_played, total_attempts, best_streak, created_at
      FROM user_progress
      WHERE user_id = ${session.userId}
    ` as UserProgress[]

    const progressMap = new Map(progress.map(p => [p.heap_id, p]))

    const result = heaps.map((heap, index) => {
      const prev = index > 0 ? heaps[index - 1] : null
      const prevProgress = prev ? progressMap.get(prev.id) : null
      const unlocked = index === 0 || prevProgress?.completed === true
      const nextHeapId = heaps[index + 1]?.id ?? null

      return {
        id: heap.id,
        heap,
        progress: progressMap.get(heap.id) ?? null,
        unlocked,
        nextHeapId,
        cachedAt: Date.now(),
      }
    })

    return NextResponse.json({ heaps: result })
  } catch (err) {
    console.error('GET /api/heaps/offline error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
