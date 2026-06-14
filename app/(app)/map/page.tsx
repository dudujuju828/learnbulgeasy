import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import MapView, { type MapData } from '@/components/MapView'
import type { GameMap, Heap, UserProgress } from '@/lib/types'

export default async function MapPage() {
  const session = await getSession()

  let maps: MapData[] = []
  let initialMapId = 1

  try {
    if (session) {
      const sql = getDb()

      const mapRows = await sql`
        SELECT id, name, theme, order_index, description, created_at
        FROM maps ORDER BY order_index ASC
      ` as GameMap[]

      const heaps = await sql`
        SELECT id, name, description, theme, "order", map_id, words, created_at
        FROM heaps ORDER BY "order" ASC
      ` as Heap[]

      const progress = await sql`
        SELECT heap_id, completed, loops_completed
        FROM user_progress WHERE user_id = ${session.userId}
      ` as (Pick<UserProgress, 'completed' | 'loops_completed'> & { heap_id: string })[]

      const progressMap = new Map(progress.map(p => [p.heap_id, p]))

      // Single global unlock chain by "order" — Map 2 unlocks once Map 1 is finished.
      const heapsState = heaps.map((heap, index) => {
        const prev = index > 0 ? heaps[index - 1] : null
        const prevProg = prev ? progressMap.get(prev.id) : null
        const prog = progressMap.get(heap.id) ?? null
        return {
          heap,
          unlocked: index === 0 || prevProg?.completed === true,
          completed: prog?.completed === true,
          loops_completed: prog?.loops_completed ?? 0,
        }
      })

      const currentIndex = heapsState.findIndex(s => s.unlocked && !s.completed)
      if (currentIndex >= 0) initialMapId = heapsState[currentIndex].heap.map_id
      else if (heapsState.length) initialMapId = heapsState[heapsState.length - 1].heap.map_id

      // Fall back to deriving maps from heap.map_id if the maps table is empty.
      const baseMaps: GameMap[] = mapRows.length
        ? mapRows
        : [...new Set(heaps.map(h => h.map_id))].sort((a, b) => a - b).map((id, i) => ({
            id,
            name: id === 1 ? 'Beginners Bay' : id === 2 ? "Pirate's Passage" : id === 3 ? 'The Summit' : `Map ${id}`,
            theme: id === 1 ? 'pirate' : id === 2 ? 'straits' : id === 3 ? 'volcano' : 'straits',
            order_index: i + 1,
            description: null,
            created_at: '',
          }))

      maps = baseMaps.map(map => ({
        id: map.id,
        name: map.name,
        theme: map.theme,
        description: map.description,
        heaps: heapsState
          .filter(s => s.heap.map_id === map.id)
          .map(s => ({
            id: s.heap.id,
            name: s.heap.name,
            description: s.heap.description,
            theme: s.heap.theme,
            unlocked: s.unlocked,
            completed: s.completed,
            inProgress: !s.completed && s.loops_completed > 0,
            loops_completed: s.loops_completed,
            isCurrent: heapsState.indexOf(s) === currentIndex,
          })),
      }))
    }
  } catch {
    // DB not configured / not migrated — show empty state
  }

  return <MapView maps={maps} initialMapId={initialMapId} />
}
