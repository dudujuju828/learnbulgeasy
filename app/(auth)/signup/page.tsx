'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Signup failed')
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
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-3 animate-float inline-block">🏴‍☠️</div>
        <h1 className="font-pirata text-4xl text-yellow-300 tracking-wide">Join the Crew</h1>
        <p className="text-blue-300 text-base mt-1">Create your Bulgarian learning voyage</p>
      </div>

      {/* Card */}
      <div className="bg-blue-950/70 rounded-3xl p-6 border border-blue-700/30 shadow-2xl backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs text-yellow-400/70 uppercase tracking-wider font-semibold">
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
              className="w-full bg-blue-900/60 border border-blue-700/40 text-white placeholder-blue-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500/50 min-h-[48px]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs text-yellow-400/70 uppercase tracking-wider font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="8+ characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              enterKeyHint="next"
              className="w-full bg-blue-900/60 border border-blue-700/40 text-white placeholder-blue-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500/50 min-h-[48px]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-xs text-yellow-400/70 uppercase tracking-wider font-semibold">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              enterKeyHint="go"
              className="w-full bg-blue-900/60 border border-blue-700/40 text-white placeholder-blue-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500/50 min-h-[48px]"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 text-center bg-red-900/20 border border-red-700/30 rounded-xl py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-amber-500 to-yellow-600 text-yellow-900 font-bold rounded-xl py-3.5 text-base active:scale-95 transition-transform disabled:opacity-50 min-h-[52px]"
          >
            {loading ? 'Signing up…' : '⚔️ Join the Voyage →'}
          </button>
        </form>
        <p className="text-center text-sm text-blue-400 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-yellow-400 font-medium hover:text-yellow-300 transition-colors inline-block py-3 px-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
