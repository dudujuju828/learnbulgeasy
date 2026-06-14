import type { NeonQueryFunction } from '@neondatabase/serverless'

export type SeedWord = { en: string; bg: string; cyr: string }
export type SeedHeap = {
  name: string
  description: string
  theme: string
  order: number
  words: SeedWord[]
}

export type SeedResult = {
  inserted: number
  skipped: number
  skippedWords: string[]
}

/**
 * Insert heaps while skipping any word whose Cyrillic (bg) form already exists
 * in the DB or earlier in this same batch. Every kept word is registered in the
 * word_index lookup table, which enforces global uniqueness at the DB level.
 *
 * Heaps that end up with zero words after dedup are skipped entirely.
 */
export async function insertHeapsDeduped(
  sql: NeonQueryFunction<false, false>,
  heaps: SeedHeap[],
  mapId: number,
): Promise<SeedResult> {
  // All Bulgarian words already present across every heap.
  const existing = (await sql`
    SELECT w->>'bg' AS bg
    FROM heaps h
    CROSS JOIN LATERAL jsonb_array_elements(h.words) w
  `) as { bg: string }[]
  const seen = new Set(existing.map((r) => r.bg))

  let inserted = 0
  let skipped = 0
  const skippedWords: string[] = []

  for (const heap of heaps) {
    const words: SeedWord[] = []
    for (const word of heap.words) {
      if (seen.has(word.bg)) {
        skipped++
        skippedWords.push(word.bg)
        continue
      }
      seen.add(word.bg)
      words.push(word)
    }

    if (words.length === 0) continue

    const rows = (await sql`
      INSERT INTO heaps (name, description, theme, "order", words, map_id)
      VALUES (${heap.name}, ${heap.description}, ${heap.theme}, ${heap.order}, ${JSON.stringify(words)}::jsonb, ${mapId})
      RETURNING id
    `) as { id: string }[]
    const heapId = rows[0].id

    for (const word of words) {
      await sql`
        INSERT INTO word_index (word_bg, heap_id)
        VALUES (${word.bg}, ${heapId})
        ON CONFLICT (word_bg) DO NOTHING
      `
    }

    inserted++
  }

  return { inserted, skipped, skippedWords }
}
