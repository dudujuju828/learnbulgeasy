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
    <div className="w-full max-w-sm animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Create account</h1>
        <p className="text-slate-400 text-sm mt-2">Start learning Bulgarian today</p>
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
              placeholder="8+ characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              enterKeyHint="next"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all duration-200 min-h-[48px]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Confirm password
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-400 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors inline-block py-2 px-1">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
