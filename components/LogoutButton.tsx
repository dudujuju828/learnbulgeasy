'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      size="sm"
      className="text-yellow-300 hover:text-white hover:bg-blue-800 text-xs"
    >
      Log out
    </Button>
  )
}
