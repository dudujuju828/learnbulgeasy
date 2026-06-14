'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <Card className="w-full max-w-sm shadow-2xl border-0">
      <CardHeader className="text-center pb-2">
        <div className="text-5xl mb-2">⚓</div>
        <CardTitle className="text-2xl font-bold text-blue-900">LearnBulgEasy</CardTitle>
        <CardDescription className="text-base">Set sail on your Bulgarian voyage</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            disabled={loading}
          >
            {loading ? 'Boarding...' : 'Set Sail →'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          New crew member?{' '}
          <Link href="/signup" className="text-blue-600 font-medium hover:underline">
            Join the voyage
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
