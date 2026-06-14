import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// One-time backfill check: scan every heap for Bulgarian (Cyrillic) words that
// appear in more than one heap. Reports duplicates only — never deletes data.
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-migration-secret')
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    const rows = (await sql`
      SELECT w->>'bg' AS word_bg,
             COUNT(*) AS occurrences,
             json_agg(json_build_object('heapId', h.id, 'heap', h.name, 'order', h."order")) AS heaps
      FROM heaps h
      CROSS JOIN LATERAL jsonb_array_elements(h.words) w
      GROUP BY w->>'bg'
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, w->>'bg'
    `) as { word_bg: string; occurrences: string; heaps: unknown }[]

    const duplicates = rows.map((r) => ({
      word: r.word_bg,
      occurrences: parseInt(r.occurrences, 10),
      heaps: r.heaps,
    }))

    if (duplicates.length === 0) {
      console.log('[dedup-check] No duplicate words found across heaps.')
    } else {
      console.warn(`[dedup-check] Found ${duplicates.length} duplicate word(s):`)
      for (const d of duplicates) {
        console.warn(`  "${d.word}" appears ${d.occurrences}× — ${JSON.stringify(d.heaps)}`)
      }
    }

    return NextResponse.json({
      success: true,
      duplicateCount: duplicates.length,
      duplicates,
    })
  } catch (err) {
    console.error('Dedup-check error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
