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
        (3, 'The Summit', 'volcano', 3, 'Climb the volcanic island to fluency')
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
