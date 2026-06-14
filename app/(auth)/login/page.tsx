'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { usePWA } from '@/components/PWAProvider'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [installed, setInstalled] = useState(false)
  const { canInstall, install } = usePWA()

  async function handleInstall() {
    const accepted = await install()
    if (accepted) setInstalled(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Login failed')
      } else {
        router.push('/map')
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Learn<span className="text-emerald-400">BulgEasy</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">Learn Bulgarian, one heap at a time</p>
      </div>

      {/* Card */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg shadow-black/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              enterKeyHint="next"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all duration-200 min-h-[48px]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              enterKeyHint="go"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all duration-200 min-h-[48px]"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg py-3.5 text-base transition-all duration-200 disabled:opacity-50 min-h-[52px]"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-400 mt-5">
          New here?{' '}
          <Link href="/signup" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors inline-block py-2">
            Create an account
          </Link>
        </p>
      </div>

      {/* Install App prompt */}
      {canInstall && !installed && (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-all duration-200 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
        >
          <Download size={16} />
          Install app — play offline anytime
        </button>
      )}
      {installed && (
        <p className="mt-4 text-center text-sm text-emerald-400">
          Added to home screen
        </p>
      )}
    </div>
  )
}
