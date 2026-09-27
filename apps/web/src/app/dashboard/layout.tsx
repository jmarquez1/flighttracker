import NavLinks from './nav-links';
import NotificationFeed from './notification-feed';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="w-52 flex-shrink-0 bg-zinc-900/70 border-r border-white/[0.06] flex flex-col">

        {/* Wordmark */}
        <div className="px-4 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-sky-500/15 border border-sky-500/30 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-100 leading-tight tracking-tight">flight control</div>
              <div className="text-[10px] text-zinc-600 leading-tight">travel biuro</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-2 py-3">
          <NavLinks />
        </nav>

        {/* Email feed — fills remaining space */}
        <NotificationFeed />

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-white/[0.06]">
          <NavLinks showLogout />
          <p className="text-[10px] text-zinc-800 mt-2 px-1.5">flights.travelbiuro.com</p>
        </div>

      </aside>

      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
