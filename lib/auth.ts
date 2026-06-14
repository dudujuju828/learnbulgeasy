import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { Session } from './types'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-please-change-in-production'
)

export const COOKIE_NAME = 'auth_token'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}
