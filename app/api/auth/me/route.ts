import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { User } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sql = getDb()
  const rows = await sql`
    SELECT id, email, created_at FROM users WHERE id = ${session.userId}
  ` as User[]

  if (!rows[0]) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: rows[0] })
}
