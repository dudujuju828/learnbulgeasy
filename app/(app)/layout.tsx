import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import NavBar from '@/components/NavBar'

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
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {children}
      </main>
      <NavBar />
    </div>
  )
}
