import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { createToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'
import type { User } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() as { email?: string; password?: string }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const sql = getDb()
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const rows = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email.toLowerCase()}, ${passwordHash})
      RETURNING id, email, created_at
    ` as User[]

    const user = rows[0]
    const token = await createToken(user.id)

    const response = NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
