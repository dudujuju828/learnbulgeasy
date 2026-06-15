'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, BookOpen, User, type LucideIcon } from 'lucide-react'

const TABS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/map', icon: Map, label: 'Map' },
  { href: '/dictionary', icon: BookOpen, label: 'Words' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function NavBar() {
  const path = usePathname()

  return (
    <nav className="shrink-0 flex border-t border-white/10 bg-slate-900/70 backdrop-blur-md z-50 pb-safe">
      {TABS.map(tab => {
        const active = path === tab.href || (tab.href !== '/map' && path.startsWith(tab.href))
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs gap-1 font-medium transition-all duration-200 min-h-[56px] justify-center ${
              active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
            <span>{tab.label}</span>
            <span
              className={`h-0.5 w-5 rounded-full transition-all duration-200 ${
                active ? 'bg-emerald-400' : 'bg-transparent'
              }`}
            />
          </Link>
        )
      })}
    </nav>
  )
}
