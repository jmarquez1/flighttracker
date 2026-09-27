'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function fmtAgo(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function NotificationFeed() {
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    try {
      const data = await fetch('/api/notifications').then(r => r.json());
      setItems(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 border-t border-white/[0.06] pt-3 pb-1">
      <div className="flex items-center justify-between px-3 mb-2">
        <span className="text-[10px] text-zinc-600 tracking-widest uppercase">emails</span>
        <Link href="/dashboard/alerts" className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors">
          all →
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-2 space-y-px">
        {items.length === 0 ? (
          <p className="text-[11px] text-zinc-700 px-1 py-2">no emails yet</p>
        ) : (
          items.map((n: any) => (
            <Link
              key={n.id}
              href={n.flight?.id ? `/dashboard/flights/${n.flight.id}` : '/dashboard/alerts'}
              className="flex items-start gap-2 px-1.5 py-1.5 rounded hover:bg-white/[0.03] transition-colors group"
            >
              <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                n.status === 'SENT'   ? 'bg-emerald-500' :
                n.status === 'FAILED' ? 'bg-red-500' : 'bg-zinc-600'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors tracking-wide">
                    {n.flight?.flightIata || '?'}
                  </span>
                  <span className="text-[10px] text-zinc-700 flex-shrink-0 tabular-nums">
                    {fmtAgo(n.sentAt || n.createdAt)}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-600 truncate leading-tight">{n.subject || '—'}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
