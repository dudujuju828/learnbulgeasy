import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import NavBar from '@/components/NavBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-[420px] mx-auto">
      <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-950 to-blue-900 text-white sticky top-0 z-50 shadow-lg border-b border-yellow-500/20">
        <Link href="/map" className="flex items-center gap-2">
          <span className="text-2xl">🏴‍☠️</span>
          <span className="font-pirata text-xl text-yellow-300 tracking-wide">LearnBulgEasy</span>
        </Link>
        <LogoutButton />
      </header>
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {children}
      </main>
      <NavBar />
    </div>
  )
}
