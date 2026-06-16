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

    // Maps are ordered by learning importance: the most useful, high-frequency
    // vocabulary first (basics, essentials, daily/modern life), then the broad
    // practical themed maps (home/work, going out), then the niche scenic maps
    // (mountains, desert, winter, forest, caves, sky, wetlands) last. display
    // order is driven by order_index (see /api/maps, which sorts by it). Map ids
    // are fixed PKs and never change; ON CONFLICT DO UPDATE re-applies the order
    // and names on every run, so this is the single source of truth for map
    // ordering — both for a fresh DB and for re-running migrate on production.
    await sql`
      INSERT INTO maps (id, name, theme, order_index, description) VALUES
        (1,  'Bulgarian Basics',     'pirate',          1,  'Greetings, numbers, family and food — your very first words'),
        (11, 'Essential Bulgarian',  'essential',       2,  'Pronouns, core verbs and the words you need first'),
        (12, 'Everyday Vocabulary',  'essential',       3,  'More high-frequency words for daily life'),
        (13, 'Daily Bulgarian',      'frequency-vocab', 4,  'Everyday speech: connectors, verbs and the words you use most'),
        (14, 'Modern Life',          'frequency-vocab', 5,  'Modern, practical vocabulary for everyday life in Bulgaria'),
        (2,  'Home & Work',          'straits',         6,  'Home, work, shopping, school and getting around town'),
        (3,  'Out & About',          'volcano',         7,  'Restaurants, travel, technology and going out'),
        (4,  'Mountains & Outdoors', 'mountain',        8,  'Hiking, weather, wildlife and the great outdoors'),
        (5,  'Desert & Travel',      'desert',          9,  'Desert crossings, survival and the long road'),
        (6,  'Winter & Arctic',      'ice',             10, 'Cold, snow, winter gear and the frozen north'),
        (7,  'Forest & Magic',       'forest',          11, 'Woods, creatures and a world of fantasy'),
        (8,  'Caves & Gems',         'crystal',         12, 'Caverns, minerals and glittering gemstones'),
        (9,  'Sky & Stars',          'sky',             13, 'Clouds, stars, flight and the open sky'),
        (10, 'Wetlands & Wildlife',  'swamp',           14, 'Marsh animals, plants and the murky wetlands')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        theme = EXCLUDED.theme,
        order_index = EXCLUDED.order_index,
        description = EXCLUDED.description
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
