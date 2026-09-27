'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, PauseCircle, PlayCircle, AlertTriangle, CheckCircle, XCircle, Clock, Plane, Package } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: 'Scheduled', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  ACTIVE:    { label: 'In Flight',  className: 'bg-green-500/20 text-green-300 border border-green-500/30' },
  LANDED:    { label: 'Landed',     className: 'bg-gray-500/20 text-gray-400 border border-gray-600/30' },
  CANCELLED: { label: 'Cancelled',  className: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  DIVERTED:  { label: 'Diverted',   className: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
  UNKNOWN:   { label: 'Unknown',    className: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
};

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  CANCELLED:       { label: 'Flight Cancelled', color: 'text-red-400' },
  DIVERTED:        { label: 'Flight Diverted', color: 'text-orange-400' },
  DELAY_30:        { label: 'Delay 30+ min', color: 'text-yellow-400' },
  DELAY_60:        { label: 'Delay 60+ min', color: 'text-orange-400' },
  DELAY_120:       { label: 'Delay 2+ hours', color: 'text-red-400' },
  GATE_CHANGE:     { label: 'Gate Changed', color: 'text-blue-400' },
  TERMINAL_CHANGE: { label: 'Terminal Changed', color: 'text-blue-400' },
  SCHEDULE_CHANGE: { label: 'Schedule Changed', color: 'text-purple-400' },
  DEPARTED:        { label: 'Departed', color: 'text-green-400' },
  ARRIVED:         { label: 'Arrived', color: 'text-green-400' },
  LANDED:          { label: 'Landed', color: 'text-gray-400' },
  STATUS_CHANGE:   { label: 'Status Update', color: 'text-gray-400' },
};

export default function FlightDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [flight, setFlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function load() {
    const r = await fetch(`/api/flights/${params.id}`);
    if (!r.ok) { router.push('/dashboard/flights'); return; }
    setFlight(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function refresh() {
    setRefreshing(true);
    try { await fetch(`/api/flights/${params.id}/refresh`, { method: 'POST' }); await load(); }
    finally { setRefreshing(false); }
  }

  async function toggleHold() {
    setToggling(true);
    try {
      await fetch(`/api/flights/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdCustomerNotifications: !flight.holdCustomerNotifications })
      });
      await load();
    } finally { setToggling(false); }
  }

  async function deleteFlight() {
    if (!confirm(`Stop tracking ${flight.flightIata}?`)) return;
    await fetch(`/api/flights/${params.id}`, { method: 'DELETE' });
    router.push('/dashboard/flights');
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!flight) return null;

  const cfg = STATUS_CONFIG[flight.status] || STATUS_CONFIG.UNKNOWN;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/flights" className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{flight.flightIata}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
            {flight.holdCustomerNotifications && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                <AlertTriangle className="w-3 h-3" /> Customer emails on hold
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{flight.airline} · {flight.flightDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleHold} disabled={toggling} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${flight.holdCustomerNotifications ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {flight.holdCustomerNotifications ? <><PlayCircle className="w-3.5 h-3.5" /> Release emails</> : <><PauseCircle className="w-3.5 h-3.5" /> Hold customer emails</>}
          </button>
          <button onClick={refresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Flight info cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-4">Flight Details</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-black">{flight.origin}</div>
              <div className="text-xs text-gray-500">{flight.originCity}</div>
            </div>
            <div className="flex-1 flex items-center gap-1">
              <div className="flex-1 h-px bg-gray-700"></div>
              <Plane className="w-4 h-4 text-gray-600" />
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">{flight.destination}</div>
              <div className="text-xs text-gray-500">{flight.destinationCity}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Scheduled Dep', flight.depScheduled ? new Date(flight.depScheduled).toUTCString().slice(0,25) : '—'],
              ['Scheduled Arr', flight.arrScheduled ? new Date(flight.arrScheduled).toUTCString().slice(0,25) : '—'],
              ['Gate', flight.gateDep || '—'],
              ['Terminal', flight.terminalDep || '—'],
              ['Delay', flight.delayDepMin ? `${flight.delayDepMin} min` : 'None'],
              ['Last checked', flight.lastPolledAt ? new Date(flight.lastPolledAt).toUTCString().slice(0,25) : 'Never'],
            ].map(([label, val]) => (
              <div key={label}><div className="text-gray-600">{label}</div><div className="text-gray-300 mt-0.5">{val}</div></div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-4">Linked Orders ({flight.orderFlights?.length ?? 0})</h3>
          {flight.orderFlights?.length === 0 ? (
            <p className="text-gray-600 text-sm">No orders linked yet.</p>
          ) : (
            <div className="space-y-2">
              {flight.orderFlights?.map((of: any) => (
                <Link key={of.id} href={`/dashboard/orders/${of.order.id}`} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                  <Package className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">{of.order.reference}</div>
                    <div className="text-xs text-gray-500">{of.order.groupName || of.order.customerName}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event timeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs text-gray-500 uppercase tracking-wide">Event Timeline ({flight._count?.events ?? 0})</h3>
        </div>
        {flight.events?.length === 0 ? (
          <p className="text-gray-600 text-sm">No events recorded yet.</p>
        ) : (
          <div className="space-y-0">
            {flight.events?.map((evt: any, i: number) => {
              const ecfg = EVENT_LABELS[evt.eventType] || { label: evt.eventType, color: 'text-gray-400' };
              return (
                <div key={evt.id} className="flex gap-4 py-3 border-b border-gray-800/50 last:border-0">
                  <div className="w-1.5 flex flex-col items-center pt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0"></div>
                    {i < flight.events.length - 1 && <div className="w-px flex-1 bg-gray-800 mt-1"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${ecfg.color}`}>{ecfg.label}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{new Date(evt.createdAt).toUTCString().slice(0,25)}</div>
                    {(evt.oldValue !== null || evt.newValue !== null) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {evt.oldValue !== null && <span className="line-through mr-2">{JSON.stringify(evt.oldValue)}</span>}
                        <span className="text-gray-300">{JSON.stringify(evt.newValue)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={deleteFlight} className="text-xs text-red-500 hover:text-red-400 transition-colors">Stop tracking this flight</button>
      </div>
    </div>
  );
}
