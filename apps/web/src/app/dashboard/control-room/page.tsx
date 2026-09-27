'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import Link from 'next/link';

/* ── status config ─────────────────────────────────────────────────────────── */
const STATUS: Record<string, { label: string; dot: string; badge: string; row: string }> = {
  SCHEDULED: {
    label: 'sch',
    dot:   'bg-zinc-500',
    badge: 'bg-zinc-800/60 text-zinc-400 border-white/[0.08]',
    row:   '',
  },
  BOARDING: {
    label: 'boarding',
    dot:   'bg-sky-400',
    badge: 'bg-sky-950/60 text-sky-300 border-sky-800/30',
    row:   'bg-sky-950/10',
  },
  ACTIVE: {
    label: 'in flight',
    dot:   'bg-emerald-400',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/30',
    row:   'bg-emerald-950/10',
  },
  LANDED: {
    label: 'landed',
    dot:   'bg-zinc-600',
    badge: 'bg-zinc-900/80 text-zinc-600 border-white/[0.04]',
    row:   'opacity-40',
  },
  CANCELLED: {
    label: 'cxld',
    dot:   'bg-red-500',
    badge: 'bg-red-950/60 text-red-300 border-red-800/30',
    row:   'bg-red-950/10',
  },
  DIVERTED: {
    label: 'diverted',
    dot:   'bg-orange-400',
    badge: 'bg-orange-950/60 text-orange-300 border-orange-800/30',
    row:   'bg-orange-950/10',
  },
  UNKNOWN: {
    label: '???',
    dot:   'bg-zinc-600',
    badge: 'bg-zinc-800/40 text-zinc-500 border-white/[0.06]',
    row:   '',
  },
};

/* ── event config ──────────────────────────────────────────────────────────── */
const EVT: Record<string, { label: string; dot: string }> = {
  CANCELLED:       { label: 'cancelled',        dot: 'bg-red-500' },
  DIVERTED:        { label: 'diverted',          dot: 'bg-orange-500' },
  BOARDING:        { label: 'boarding',          dot: 'bg-sky-400' },
  DELAY_30:        { label: 'delay 30+ min',     dot: 'bg-amber-400' },
  DELAY_60:        { label: 'delay 60+ min',     dot: 'bg-orange-400' },
  DELAY_120:       { label: 'delay 2h+',         dot: 'bg-red-400' },
  GATE_ASSIGNED:   { label: 'gate assigned',     dot: 'bg-sky-400' },
  GATE_CHANGE:     { label: 'gate changed',      dot: 'bg-indigo-400' },
  TERMINAL_CHANGE: { label: 'terminal changed',  dot: 'bg-violet-400' },
  SCHEDULE_CHANGE: { label: 'rescheduled',       dot: 'bg-violet-400' },
  DEPARTED:        { label: 'departed',          dot: 'bg-emerald-400' },
  ARRIVED:         { label: 'arrived',           dot: 'bg-teal-400' },
  STATUS_CHANGE:   { label: 'status update',     dot: 'bg-zinc-500' },
  LANDED:          { label: 'landed',            dot: 'bg-zinc-500' },
};

/* ── date range helpers ────────────────────────────────────────────────────── */
const todayStr = () => new Date().toISOString().slice(0, 10);

function inRange(flightDate: string | null | undefined, range: string): boolean {
  if (!flightDate) return range === '';
  if (range === '') return true;
  if (range === 'today') return flightDate === todayStr();
  const now = new Date();
  const fd = new Date(flightDate);
  if (range === '14d') {
    const limit = new Date(now); limit.setDate(limit.getDate() + 14);
    return fd >= new Date(todayStr()) && fd <= limit;
  }
  if (range === '30d') {
    const limit = new Date(now); limit.setDate(limit.getDate() + 30);
    return fd >= new Date(todayStr()) && fd <= limit;
  }
  return flightDate === range;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */
function utc(dt: string | null): string {
  if (!dt) return '--:--';
  return new Date(dt).toUTCString().slice(17, 22);
}
function fmtDate(dt: string | null): string {
  if (!dt) return '——';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
function ago(dt: string): string {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const DATE_PILLS = [
  { key: 'today', label: 'today' },
  { key: '14d',   label: '14 days' },
  { key: '30d',   label: '30 days' },
  { key: '',      label: 'all' },
] as const;

/* ── component ─────────────────────────────────────────────────────────────── */
export default function ControlRoomPage() {
  const [flights, setFlights]   = useState<any[]>([]);
  const [events,  setEvents]    = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [last,    setLast]      = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<string>('today');
  const [status,  setStatus]    = useState('');

  const load = useCallback(async () => {
    try {
      const [fd, ed] = await Promise.all([
        fetch('/api/flights').then(r => r.json()),
        fetch('/api/events/recent').then(r => r.json()),
      ]);
      setFlights(Array.isArray(fd) ? fd : []);
      setEvents(Array.isArray(ed) ? ed : []);
      setLast(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const rows = flights
    .filter(f => inRange(f.flightDate, dateRange) && (!status || f.status === status))
    .sort((a, b) => {
      if (!a.depScheduled) return 1;
      if (!b.depScheduled) return -1;
      return +new Date(a.depScheduled) - +new Date(b.depScheduled);
    });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950">

      {/* ── top bar ──────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-zinc-900/40">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-sm font-bold text-zinc-100 tracking-tight">control room</h1>
            <p className="text-[10px] text-zinc-600 tabular-nums mt-px">
              auto-refresh 30s &middot; {last.toUTCString().slice(17, 22)} utc &middot; {rows.length} flight{rows.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* filters */}
        <div className="flex items-center gap-2">

          {/* date range pills */}
          <div className="flex items-center bg-zinc-800/50 rounded-lg p-0.5 border border-white/[0.06]">
            {DATE_PILLS.map(pill => (
              <button
                key={pill.key}
                onClick={() => setDateRange(pill.key)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors tabular-nums ${
                  dateRange === pill.key
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="bg-zinc-800/60 border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-sky-500/50"
          >
            <option value="">all status</option>
            <option value="SCHEDULED">scheduled</option>
            <option value="BOARDING">boarding</option>
            <option value="ACTIVE">in flight</option>
            <option value="CANCELLED">cancelled</option>
            <option value="DIVERTED">diverted</option>
            <option value="LANDED">landed</option>
          </select>

          {status && (
            <button
              onClick={() => setStatus('')}
              className="text-[10px] text-zinc-600 hover:text-zinc-300 px-1.5 transition-colors"
            >
              clear
            </button>
          )}

          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-30 ml-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── body: FIDS + activity log ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 gap-0">

        {/* FIDS board */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* column headers */}
          <div className="flex-shrink-0 grid gap-2 px-5 py-2 border-b border-white/[0.06] bg-zinc-900/30"
               style={{ gridTemplateColumns: '90px 72px 52px 88px 88px 72px 52px 60px 90px 1fr' }}>
            {['flight','date','from','sched dep','est dep','terminal','gate','delay','status','orders'].map(h => (
              <span key={h} className="text-[10px] text-zinc-600 uppercase tracking-widest">{h}</span>
            ))}
          </div>

          {/* rows */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {loading && rows.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-xs text-zinc-700">loading...</div>
            ) : rows.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-xs text-zinc-700">no flights match filters</div>
            ) : (
              rows.map((f) => {
                const s   = STATUS[f.status] || STATUS.UNKNOWN;
                const late = f.delayDepMin > 0;
                const orders = f.orderFlights ?? [];

                return (
                  <Link
                    key={f.id}
                    href={`/dashboard/flights/${f.id}`}
                    className={`grid gap-2 px-5 py-2.5 border-b border-white/[0.04] items-center text-xs hover:bg-white/[0.02] transition-colors ${s.row}`}
                    style={{ gridTemplateColumns: '90px 72px 52px 88px 88px 72px 52px 60px 90px 1fr' }}
                  >
                    {/* flight */}
                    <span className="font-bold text-zinc-100 tracking-widest tabular-nums">{f.flightIata}</span>

                    {/* date */}
                    <span className="text-zinc-600 tabular-nums text-[11px]">{fmtDate(f.depScheduled || f.flightDate)}</span>

                    {/* origin */}
                    <span className="font-bold text-zinc-300 tracking-wide">{f.origin || '—'}</span>

                    {/* sched dep */}
                    <span className="text-zinc-500 tabular-nums">{utc(f.depScheduled)}</span>

                    {/* est dep */}
                    <span className={`tabular-nums font-medium ${late ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {utc(f.depEstimated || f.depScheduled)}
                    </span>

                    {/* terminal */}
                    <span className={f.terminalDep ? 'text-violet-300 font-bold' : 'text-zinc-800'}>
                      {f.terminalDep ? `T${f.terminalDep}` : '——'}
                    </span>

                    {/* gate */}
                    <span className={f.gateDep ? 'text-sky-300 font-bold' : 'text-zinc-800'}>
                      {f.gateDep || '——'}
                    </span>

                    {/* delay */}
                    <span className={f.delayDepMin ? 'text-amber-400 font-semibold' : 'text-zinc-800'}>
                      {f.delayDepMin ? `+${f.delayDepMin}m` : '——'}
                    </span>

                    {/* status */}
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot} ${['BOARDING','ACTIVE'].includes(f.status) ? 'animate-pulse' : ''}`} />
                      <span className={`text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded border ${s.badge}`}>
                        {s.label}
                      </span>
                    </span>

                    {/* orders */}
                    <span className="flex flex-col gap-0.5">
                      {orders.length === 0 ? (
                        <span className="text-zinc-800">——</span>
                      ) : orders.map((of: any) => (
                        <span key={of.id} className="text-[10px] text-sky-400/80 font-mono tracking-wide truncate">
                          {of.order?.reference || '—'}
                        </span>
                      ))}
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          <div className="flex-shrink-0 px-5 py-2 border-t border-white/[0.04]">
            <p className="text-[10px] text-zinc-800">all times utc &middot; click row to view detail</p>
          </div>
        </div>

        {/* ── activity log ──────────────────────────────────────────────────────── */}
        <aside className="w-64 flex-shrink-0 border-l border-white/[0.06] flex flex-col bg-zinc-900/30">

          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <Activity className="w-3 h-3 text-zinc-600" />
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">activity</span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {events.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-zinc-700">no events yet</div>
            ) : (
              <div>
                {events.map((evt: any) => {
                  const ec = EVT[evt.eventType] || { label: evt.eventType.toLowerCase(), dot: 'bg-zinc-600' };
                  return (
                    <Link
                      key={evt.id}
                      href={`/dashboard/flights/${evt.flight.id}`}
                      className="block px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ec.dot}`} />
                        <span className="text-xs font-bold text-zinc-300 tracking-wide">{evt.flight.flightIata}</span>
                        <span className="text-[10px] text-zinc-700 truncate">{evt.flight.origin} &rarr; {evt.flight.destination}</span>
                      </div>
                      <div className="flex items-center justify-between pl-3.5">
                        <span className="text-[11px] text-zinc-500">{ec.label}</span>
                        <span className="text-[10px] text-zinc-700 tabular-nums flex-shrink-0">{ago(evt.createdAt)}</span>
                      </div>
                      {evt.newValue && (
                        <div className="pl-3.5 mt-0.5 text-[10px] text-zinc-600 truncate">&rarr; {evt.newValue}</div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
