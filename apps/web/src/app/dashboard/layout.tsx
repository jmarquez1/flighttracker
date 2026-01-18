import Link from 'next/link'
import { LayoutDashboard, Plane, Users, Calendar, Settings } from 'lucide-react'

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">Flight Tracker</h2>
        </div>
        <nav className="mt-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
