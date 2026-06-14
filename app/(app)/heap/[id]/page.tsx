import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import HeapGame from '@/components/HeapGame'
import type { Heap, UserProgress } from '@/lib/types'

export default async function HeapPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const sql = getDb()

  const heaps = await sql`
    SELECT id, name, description, theme, "order", words, created_at
    FROM heaps WHERE id = ${id}
  ` as Heap[]

  if (!heaps.length) redirect('/map')
  const heap = heaps[0]

  // Check unlock status
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

  if (!unlocked) redirect('/map')

  const progress = await sql`
    SELECT id, user_id, heap_id, completed, loops_completed, last_played, total_attempts, best_streak, created_at
    FROM user_progress
    WHERE user_id = ${session.userId} AND heap_id = ${id}
  ` as UserProgress[]

  // Find the next heap
  const nextHeaps = await sql`
    SELECT id FROM heaps WHERE "order" = ${heap.order + 1}
  ` as { id: string }[]
  const nextHeapId = nextHeaps[0]?.id ?? null

  return (
    <HeapGame
      heap={heap}
      progress={progress[0] ?? null}
      nextHeapId={nextHeapId}
    />
  )
}
