'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAContextValue {
  isOnline: boolean
  canInstall: boolean
  install: () => Promise<boolean>
}

const PWAContext = createContext<PWAContextValue>({
  isOnline: true,
  canInstall: false,
  install: async () => false,
})

export function usePWA() {
  return useContext(PWAContext)
}

async function syncPendingProgress() {
  try {
    const { getPendingSync, removePendingSyncItem } = await import('@/lib/idb')
    const pending = await getPendingSync()
    if (!pending.length) return

    try {
      const res = await fetch('/api/progress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: pending.map(p => ({ heap_id: p.heap_id, ...p.data })),
        }),
      })
      if (res.ok) {
        await Promise.all(pending.map(p => removePendingSyncItem(p.heap_id)))
      }
    } catch {
      // Still offline — keep in queue
    }
  } catch {
    // IDB not available
  }
}

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const wasOffline = useRef(false)

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice.outcome === 'accepted'
  }, [deferredPrompt])

  useEffect(() => {
    const online = navigator.onLine
    setIsOnline(online)
    wasOffline.current = !online

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline.current) syncPendingProgress()
      wasOffline.current = false
    }

    const handleOffline = () => {
      setIsOnline(false)
      wasOffline.current = true
    }

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
    }
  }, [])

  return (
    <PWAContext.Provider value={{ isOnline, canInstall: !!deferredPrompt, install }}>
      {children}
    </PWAContext.Provider>
  )
}
