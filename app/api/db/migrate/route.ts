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

    await sql`CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_progress_heap_id ON user_progress(heap_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_dictionary_user_id ON dictionary(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_heaps_order ON heaps("order")`

    return NextResponse.json({ success: true, message: 'Migration completed' })
  } catch (err) {
    console.error('Migration error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
