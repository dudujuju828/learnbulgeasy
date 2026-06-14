export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#060d1f] via-blue-950 to-blue-900 px-4 relative overflow-hidden">
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <span className="absolute top-10 left-8 text-yellow-200/70 text-xs">★</span>
        <span className="absolute top-20 left-20 text-yellow-100/50 text-[10px]">✦</span>
        <span className="absolute top-8 right-16 text-yellow-200/60 text-xs">★</span>
        <span className="absolute top-24 right-8 text-yellow-100/40 text-[10px]">✦</span>
        <span className="absolute top-36 left-12 text-yellow-200/50 text-[10px]">✦</span>
        <span className="absolute top-16 left-1/3 text-yellow-100/60 text-xs">★</span>
        <span className="absolute top-6 right-1/3 text-yellow-200/50 text-xs">★</span>
        <span className="absolute top-32 right-1/4 text-yellow-100/40 text-[10px]">✦</span>
      </div>

      {/* Moon */}
      <div className="absolute top-8 right-8 text-4xl opacity-80 pointer-events-none select-none">🌙</div>

      {/* Waves at bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden h-12 pointer-events-none select-none">
        <div className="text-blue-400/25 text-3xl whitespace-nowrap animate-wave">
          ～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～
        </div>
      </div>

      {children}
    </div>
  )
}
