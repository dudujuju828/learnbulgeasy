'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/map', icon: '🗺️', label: 'Map' },
  { href: '/dictionary', icon: '📖', label: 'Dictionary' },
  { href: '/profile', icon: '👤', label: 'Profile' },
]

export default function NavBar() {
  const path = usePathname()

  return (
    <nav className="flex border-t border-blue-200 bg-white sticky bottom-0 z-50">
      {TABS.map(tab => {
        const active = path === tab.href || (tab.href !== '/map' && path.startsWith(tab.href))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-3 text-xs gap-0.5 font-medium transition-colors ${
              active
                ? 'text-blue-900 bg-blue-50'
                : 'text-gray-400 hover:bg-blue-50'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
            {active && <span className="w-4 h-0.5 bg-blue-900 rounded-full mt-0.5" />}
          </Link>
        )
      })}
    </nav>
  )
}
