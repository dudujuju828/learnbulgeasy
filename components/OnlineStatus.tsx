'use client'

import { usePWA } from './PWAProvider'

export default function OnlineStatus() {
  const { isOnline } = usePWA()

  return (
    <div
      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border transition-colors ${
        isOnline
          ? 'bg-green-500/10 text-green-400 border-green-500/20'
          : 'bg-red-500/10 text-red-400 border-red-500/20'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isOnline ? 'bg-green-400' : 'bg-red-500 animate-pulse'
        }`}
      />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  )
}
