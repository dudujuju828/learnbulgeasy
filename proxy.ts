import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-please-change-in-production'
)

const AUTH_PAGES = ['/login', '/signup']
const PUBLIC_API_PATTERNS = ['/api/auth', '/api/db']

async function isValidToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET)
    return true
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  if (PUBLIC_API_PATTERNS.some(pattern => pathname.startsWith(pattern))) return NextResponse.next()

  const isAuthPage = AUTH_PAGES.includes(pathname)

  if (isAuthPage) {
    if (token && (await isValidToken(token))) {
      return NextResponse.redirect(new URL('/map', request.url))
    }
    return NextResponse.next()
  }

  if (!token || !(await isValidToken(token))) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    if (token) response.cookies.delete('auth_token')
    return response
  }

  return NextResponse.next()
}

export const config = {
  // Exclude Next internals AND PWA assets (service worker, manifest, offline
  // page, icons) so they're publicly served and never redirected to /login —
  // otherwise SW registration and offline caching break when the cookie is absent.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|offline\\.html|icon-).*)'],
}
