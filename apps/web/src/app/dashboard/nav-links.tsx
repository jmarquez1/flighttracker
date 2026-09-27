'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Plane, Package, Bell, Settings, LogOut, Monitor } from 'lucide-react';

const nav = [
  { href: '/dashboard/control-room', label: 'control room', icon: Monitor },
  { href: '/dashboard/flights',      label: 'flights',      icon: Plane },
  { href: '/dashboard/orders',       label: 'orders',       icon: Package },
  { href: '/dashboard/alerts',       label: 'alert log',    icon: Bell },
  { href: '/dashboard/settings',     label: 'settings',     icon: Settings },
];

export default function NavLinks({ showLogout }: { showLogout?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  if (showLogout) {
    return (
      <button
        onClick={async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          router.push('/login');
        }}
        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        sign out
      </button>
    );
  }

  return (
    <div className="space-y-0.5">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors ${
              active
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
            }`}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
