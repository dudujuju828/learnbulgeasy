import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import NavBar from '@/components/NavBar'
import OnlineStatus from '@/components/OnlineStatus'
import OfflineSeeder from '@/components/OfflineSeeder'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <OfflineSeeder />
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900/70 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/10">
        <Link href="/map" className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-white">
            Learn<span className="text-emerald-400">BulgEasy</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <OnlineStatus />
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {children}
      </main>
      <NavBar />
    </div>
  )
}
