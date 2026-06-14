'use client'

import { useEffect } from 'react'
import { seedOfflineHeaps } from './PWAProvider'

// Mounted inside the authenticated (app) layout, so it runs whenever the user
// enters the app — including the client-side login → /map transition, where
// PWAProvider (in the root layout) does not remount. Seeds all heaps for
// offline play. Renders nothing.
export default function OfflineSeeder() {
  useEffect(() => {
    if (navigator.onLine) seedOfflineHeaps()
  }, [])
  return null
}
