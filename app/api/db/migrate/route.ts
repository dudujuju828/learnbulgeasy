import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-migration-secret')
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS heaps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        theme TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        words JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Multiple pirate maps — each groups a run of heaps
    await sql`
      CREATE TABLE IF NOT EXISTS maps (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        theme TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      INSERT INTO maps (id, name, theme, order_index, description) VALUES
        (1, 'Beginners Bay', 'pirate', 1, 'Set sail through the basics of Bulgarian'),
        (2, 'Pirate''s Passage', 'straits', 2, 'Navigate the misty straits and trade routes'),
        (3, 'The Summit', 'volcano', 3, 'Climb the volcanic island to fluency'),
        (4, 'Mountain Pass', 'mountain', 4, 'Trek the high ranges and snowy peaks'),
        (5, 'Desert Oasis', 'desert', 5, 'Cross the burning sands to the green water'),
        (6, 'Frozen Tundra', 'ice', 6, 'Trek the polar ice to reach safe harbour'),
        (7, 'Enchanted Forest', 'forest', 7, 'Wander the magic woods and break the spell'),
        (8, 'Crystal Caverns', 'crystal', 8, 'Descend the glittering caves to the mother lode'),
        (9, 'Celestial Skies', 'sky', 9, 'Ride the winds above the clouds to the constellation gate'),
        (10, 'The Murky Swamp', 'swamp', 10, 'Venture into the murky depths of the Bulgarian marshlands')
      ON CONFLICT (id) DO NOTHING
    `

    // Insert "Essential Bulgarian" as the 3rd map. Map ids are fixed PKs; display
    // order is driven by order_index. Slide existing maps 2-10 down one slot, then
    // drop Essential Bulgarian into order_index=3 (Everyday Vocabulary takes slot 2).
    // Guarded so re-running migrate is a no-op (the shift only fires while map 2
    // still sits at slot 2).
    await sql`
      UPDATE maps SET order_index = order_index + 1
      WHERE id >= 2 AND (SELECT order_index FROM maps WHERE id = 2) = 2
    `
    await sql`
      INSERT INTO maps (id, name, theme, order_index, description) VALUES
        (11, 'Essential Bulgarian', 'essential', 3, 'Everyday words you will actually use')
      ON CONFLICT (id) DO NOTHING
    `

    // Insert \"Everyday Vocabulary\" (Map 12) as the 2nd map, slotting between
    // Beginners Bay (order_index=1) and Essential Bulgarian (order_index=3).
    // Slide maps 2-10 down one slot, then insert Map 12 at order_index=2.
    // Guarded so a second migrate run is a no-op (the shift only fires while
    // map 2 still sits at slot 3).
    await sql`
      UPDATE maps SET order_index = order_index + 1
      WHERE id >= 2 AND (SELECT order_index FROM maps WHERE id = 2) = 3
    `
    await sql`
      INSERT INTO maps (id, name, theme, order_index, description) VALUES
        (12, 'Everyday Vocabulary', 'essential', 2, 'More high-frequency words for daily life')
      ON CONFLICT (id) DO NOTHING
    `

    // Insert "Daily Bulgarian" (Map 13) as the 2nd map, slotting between Beginners
    // Bay (order_index=1) and Everyday Vocabulary. Slide maps 2-12 down one slot,
    // then insert Map 13 at order_index=2. Guarded so a second migrate run is a
    // no-op (the shift only fires while Everyday Vocabulary still sits at slot 2).
    await sql`
      UPDATE maps SET order_index = order_index + 1
      WHERE id >= 2 AND (SELECT order_index FROM maps WHERE id = 12) = 2
    `
    await sql`
      INSERT INTO maps (id, name, theme, order_index, description) VALUES
        (13, 'Daily Bulgarian', 'frequency-vocab', 2, 'Everyday speech: connectors, verbs and the words you use most')
      ON CONFLICT (id) DO NOTHING
    `

    // Tie heaps to a map (existing heaps default to Map 1 = Beginners Bay)
    await sql`ALTER TABLE heaps ADD COLUMN IF NOT EXISTS map_id INTEGER DEFAULT 1`
    await sql`UPDATE heaps SET map_id = 1 WHERE map_id IS NULL`
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'heaps_map_id_fkey') THEN
          ALTER TABLE heaps ADD CONSTRAINT heaps_map_id_fkey FOREIGN KEY (map_id) REFERENCES maps(id);
        END IF;
      END $$;
    `

    // Make room for Essential Bulgarian's heaps (orders 26-50) by sliding every
    // heap on maps 2-10 up by 25. Guarded on map 2's first heap still sitting at
    // order 26, so a second migrate run leaves the already-shifted orders alone.
    await sql`
      UPDATE heaps SET "order" = "order" + 25
      WHERE map_id IN (2, 3, 4, 5, 6, 7, 8, 9, 10)
        AND (SELECT MIN("order") FROM heaps WHERE map_id = 2) = 26
    `

    await sql`
      CREATE TABLE IF NOT EXISTS user_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        heap_id UUID NOT NULL REFERENCES heaps(id),
        completed BOOLEAN DEFAULT false,
        loops_completed INTEGER DEFAULT 0,
        last_played TIMESTAMP,
        total_attempts INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, heap_id)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS dictionary (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        heap_id UUID NOT NULL REFERENCES heaps(id),
        words JSONB NOT NULL,
        unlocked_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Resume-on-last-map: remember which map the user last played a heap on
    await sql`ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS current_map_id INTEGER`

    // Infinite Mode: personal best streak lives on the user row
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS infinite_best_streak INTEGER`

    await sql`
      CREATE TABLE IF NOT EXISTS infinite_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        streak INTEGER NOT NULL,
        words_seen INTEGER NOT NULL,
        accuracy INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Global word uniqueness: no Bulgarian (Cyrillic) word may appear in more
    // than one heap. word_bg is the PRIMARY KEY, so the constraint is enforced
    // at insert time by the seed endpoints.
    await sql`
      CREATE TABLE IF NOT EXISTS word_index (
        word_bg TEXT PRIMARY KEY,
        heap_id UUID NOT NULL REFERENCES heaps(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Backfill the lookup table from existing heaps. One heap per word; any
    // pre-existing duplicate words across heaps are collapsed to a single owner
    // (existing data is left untouched — see /api/db/dedup-check for a report).
    await sql`
      INSERT INTO word_index (word_bg, heap_id)
      SELECT w->>'bg' AS word_bg, MIN(h.id::text)::uuid AS heap_id
      FROM heaps h
      CROSS JOIN LATERAL jsonb_array_elements(h.words) w
      GROUP BY w->>'bg'
      ON CONFLICT (word_bg) DO NOTHING
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_word_index_heap_id ON word_index(heap_id)`

    await sql`CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_progress_heap_id ON user_progress(heap_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_dictionary_user_id ON dictionary(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_heaps_order ON heaps("order")`
    await sql`CREATE INDEX IF NOT EXISTS idx_heaps_map_id ON heaps(map_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_infinite_attempts_user_id ON infinite_attempts(user_id)`

    return NextResponse.json({ success: true, message: 'Migration completed' })
  } catch (err) {
    console.error('Migration error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
