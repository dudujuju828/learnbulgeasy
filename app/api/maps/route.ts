import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { GameMap, Heap, UserProgress } from '@/lib/types'

// Returns every map with its heaps + the user's progress and unlock state.
// Unlock is a single global chain by heap "order" (so Map 2's first heap
// unlocks once the last heap of Map 1 is completed).
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    const maps = await sql`
      SELECT id, name, theme, order_index, description, created_at
      FROM maps ORDER BY order_index ASC
    ` as GameMap[]

    const heaps = await sql`
      SELECT id, name, description, theme, "order", map_id, words, created_at
      FROM heaps ORDER BY "order" ASC
    ` as Heap[]

    const progress = await sql`
      SELECT heap_id, completed, loops_completed, last_played, total_attempts, best_streak
      FROM user_progress WHERE user_id = ${session.userId}
    ` as Pick<UserProgress, 'heap_id' | 'completed' | 'loops_completed' | 'last_played' | 'total_attempts' | 'best_streak'>[]

    const progressMap = new Map(progress.map(p => [p.heap_id, p]))

    const heapsWithState = heaps.map((heap, index) => {
      const prev = index > 0 ? heaps[index - 1] : null
      const prevProgress = prev ? progressMap.get(prev.id) : null
      const unlocked = index === 0 || prevProgress?.completed === true
      return {
        id: heap.id,
        name: heap.name,
        description: heap.description,
        theme: heap.theme,
        order: heap.order,
        map_id: heap.map_id,
        unlocked,
        progress: progressMap.get(heap.id) ?? null,
      }
    })

    const result = maps.map(map => ({
      ...map,
      heaps: heapsWithState.filter(h => h.map_id === map.id),
    }))

    return NextResponse.json({ maps: result })
  } catch (err) {
    console.error('GET /api/maps error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
