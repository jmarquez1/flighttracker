import Link from 'next/link'
import { LayoutDashboard, Plane, Users, Calendar, Settings, Zap } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { name: 'Trips', href: '/dashboard/trips', icon: Calendar },
    { name: 'Flights', href: '/dashboard/flights', icon: Plane },
    { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
    { name: 'Events', href: '/dashboard/events', icon: LayoutDashboard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-[#050505] text-[#e0e0e0] font-sans">
      {/* Sidebar - HUD Style */}
      <aside className="w-64 bg-black border-r border-white/10">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            <span className="font-mono text-lg font-black tracking-tighter uppercase">SKY_TRACK</span>
          </div>
          <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Command Center V1</div>
        </div>
        
        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-indigo-400 hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-8 border-t border-white/10 bg-black">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Link: Stable</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="radar-scan opacity-20" />
        <div className="p-12 relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
