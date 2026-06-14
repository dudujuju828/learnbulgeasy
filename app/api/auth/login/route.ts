import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { createToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

interface UserRow {
  id: string
  email: string
  password_hash: string
  created_at: string
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() as { email?: string; password?: string }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const sql = getDb()
    const rows = await sql`
      SELECT id, email, password_hash, created_at
      FROM users
      WHERE email = ${email.toLowerCase()}
    ` as UserRow[]

    const user = rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createToken(user.id)

    const response = NextResponse.json({ user: { id: user.id, email: user.email } })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
