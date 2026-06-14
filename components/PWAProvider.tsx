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

// Pull every heap + vocab and store it in IndexedDB so all heaps are playable
// offline, even ones the user has never opened. Safe to call repeatedly.
export async function seedOfflineHeaps() {
  try {
    const res = await fetch('/api/heaps/offline')
    if (!res.ok) return // 401 when logged out, etc. — nothing to seed
    const json = await res.json() as { heaps: import('@/lib/idb').CachedHeap[] }
    if (!json.heaps?.length) return
    const { seedHeaps } = await import('@/lib/idb')
    await seedHeaps(json.heaps)
  } catch (err) {
    console.warn('[pwa] offline seed failed (offline?)', err)
  }
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
      if (wasOffline.current) {
        syncPendingProgress()
        seedOfflineHeaps()
      }
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
