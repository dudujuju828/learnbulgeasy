'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/map', icon: '🗺️', label: 'Map' },
  { href: '/dictionary', icon: '💰', label: 'Treasure' },
  { href: '/profile', icon: '🏴‍☠️', label: 'Captain' },
]

export default function NavBar() {
  const path = usePathname()

  return (
    <nav className="flex border-t border-yellow-500/20 bg-blue-950 sticky bottom-0 z-50 pb-safe">
      {TABS.map(tab => {
        const active = path === tab.href || (tab.href !== '/map' && path.startsWith(tab.href))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-3 text-xs gap-0.5 font-medium transition-colors min-h-[56px] justify-center ${
              active
                ? 'text-yellow-300'
                : 'text-blue-400 hover:text-blue-200'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="mt-0.5">{tab.label}</span>
            {active && <span className="w-5 h-0.5 bg-yellow-400 rounded-full mt-0.5" />}
          </Link>
        )
      })}
    </nav>
  )
}
