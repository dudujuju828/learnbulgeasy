import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-[430px] mx-auto">
      <header className="flex items-center justify-between px-4 py-3 bg-blue-900 text-white sticky top-0 z-50 shadow-md">
        <Link href="/map" className="flex items-center gap-2 font-bold text-lg">
          <span>⚓</span>
          <span className="text-yellow-300">LearnBulgEasy</span>
        </Link>
        <LogoutButton />
      </header>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <nav className="flex border-t border-blue-200 bg-white sticky bottom-0 z-50">
        <Link
          href="/map"
          className="flex-1 flex flex-col items-center py-3 text-xs gap-1 text-blue-700 font-medium hover:bg-blue-50 transition-colors"
        >
          <span className="text-xl">🗺️</span>
          <span>Map</span>
        </Link>
        <Link
          href="/dictionary"
          className="flex-1 flex flex-col items-center py-3 text-xs gap-1 text-gray-400 font-medium hover:bg-blue-50 transition-colors"
        >
          <span className="text-xl">📖</span>
          <span>Dictionary</span>
        </Link>
        <Link
          href="/profile"
          className="flex-1 flex flex-col items-center py-3 text-xs gap-1 text-gray-400 font-medium hover:bg-blue-50 transition-colors"
        >
          <span className="text-xl">👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  )
}
