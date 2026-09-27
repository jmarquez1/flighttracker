'use client';
import { useEffect, useState } from 'react';
import { Plane, Plus, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Search, Upload, X, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',    icon: Clock },
  BOARDING:  { label: 'Boarding',  color: 'bg-sky-500/20 text-sky-300 border-sky-500/30',       icon: Plane },
  ACTIVE:    { label: 'In Flight', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: Plane },
  LANDED:    { label: 'Landed',    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',    icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500/20 text-red-300 border-red-500/30',       icon: XCircle },
  DIVERTED:  { label: 'Diverted',  color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: AlertTriangle },
  UNKNOWN:   { label: 'Unknown',   color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: AlertTriangle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function AddFlightModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [iata, setIata] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    if (!iata || !date) return;
    setSearching(true); setError(''); setPreview(null);
    try {
      const r = await fetch(`/api/flights/preview?iata=${iata.toUpperCase()}&date=${date}`);
      if (!r.ok) { setError('Flight not found. Check the IATA code and date.'); return; }
      setPreview(await r.json());
    } catch { setError('API error. Try again.'); }
    finally { setSearching(false); }
  }

  async function add() {
    setLoading(true);
    try {
      const r = await fetch('/api/flights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flightIata: iata.toUpperCase(), flightDate: date }) });
      if (!r.ok) throw new Error('Failed');
      onAdded(); onClose();
    } catch { setError('Could not add flight.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-5">Track a Flight</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Flight Number</label>
              <input value={iata} onChange={e => setIata(e.target.value.toUpperCase())} placeholder="IB3456" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" onKeyDown={e => e.key === 'Enter' && search()} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <button onClick={search} disabled={searching || !iata} className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
            <Search className="w-4 h-4" />{searching ? 'Searching...' : 'Search Flight'}
          </button>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          {preview && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{preview.flightIata}</span>
                <StatusBadge status={preview.status} />
              </div>
              <div className="text-sm text-gray-400">{preview.airline}</div>
              <div className="text-sm">
                <span className="font-semibold">{preview.origin}</span>
                <span className="text-gray-600 mx-2">&rarr;</span>
                <span className="font-semibold">{preview.destination}</span>
              </div>
              {preview.depScheduled && (
                <div className="text-xs text-gray-500">
                  Dep: {new Date(preview.depScheduled).toUTCString().slice(5, 22)} UTC
                </div>
              )}
              <button onClick={add} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-50">
                {loading ? 'Adding...' : 'Add to Tracker'}
              </button>
            </div>
          )}
          <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-300 py-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function BulkImportModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<{ iata: string; date: string; status: 'ok' | 'err' | 'dup'; msg?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function runImport() {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) return;
    setLoading(true);
    const out: typeof results = [];
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 2) { out.push({ iata: line, date: '', status: 'err', msg: 'Invalid format (expected: IATA DATE)' }); continue; }
      const [iata, date] = parts;
      try {
        const r = await fetch('/api/flights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flightIata: iata.toUpperCase(), flightDate: date })
        });
        const json = await r.json();
        if (r.status === 201) {
          out.push({ iata, date, status: json.alreadyExisted ? 'dup' : 'ok', msg: json.alreadyExisted ? 'Already tracked' : undefined });
        } else {
          out.push({ iata, date, status: 'err', msg: json.error || 'Failed' });
        }
      } catch (e: any) {
        out.push({ iata, date, status: 'err', msg: e.message });
      }
    }
    setResults(out);
    setLoading(false);
    setDone(true);
    if (out.some(r => r.status === 'ok')) onAdded();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Bulk Import Flights</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>
        {!done ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">One flight per line: <code className="bg-gray-800 px-1 rounded">IATA DATE</code></p>
            <p className="text-xs text-gray-600">Example: FR1234 2026-04-15</p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={"FR4052 2026-04-03\nIBE4977 2026-04-03\nVLG5458 2026-04-04"}
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={runImport} disabled={loading || !text.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-50">
                {loading ? 'Importing...' : 'Import Flights'}
              </button>
              <button onClick={onClose} className="px-4 text-sm text-gray-500 hover:text-gray-300">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm px-3 py-2 rounded-lg ${r.status === 'ok' ? 'bg-green-500/10 text-green-300' : r.status === 'dup' ? 'bg-gray-800 text-gray-400' : 'bg-red-500/10 text-red-300'}`}>
                  <span className="font-mono font-bold w-20">{r.iata}</span>
                  <span className="text-xs w-24">{r.date}</span>
                  <span className="flex-1 text-xs">{r.status === 'ok' ? '+ Added' : r.status === 'dup' ? '— Already tracked' : `x ${r.msg}`}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              {results.filter(r => r.status === 'ok').length} added &middot; {results.filter(r => r.status === 'dup').length} already tracked &middot; {results.filter(r => r.status === 'err').length} failed
            </div>
            <button onClick={onClose} className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlightsPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setFlights(await (await fetch('/api/flights')).json()); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function refresh(id: string) {
    setRefreshing(id);
    try { await fetch(`/api/flights/${id}/refresh`, { method: 'POST' }); await load(); }
    finally { setRefreshing(null); }
  }

  async function deleteFlight(id: string, iata: string) {
    if (!confirm(`Delete ${iata} and all its events? This cannot be undone.`)) return;
    setDeleting(id);
    try { await fetch(`/api/flights/${id}`, { method: 'DELETE' }); await load(); }
    finally { setDeleting(null); }
  }

  async function togglePause(id: string, paused: boolean) {
    setToggling(id);
    try {
      await fetch(`/api/flights/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollingPaused: !paused }),
      });
      await load();
    } finally { setToggling(null); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Flight Board</h1>
          <p className="text-gray-500 text-sm mt-0.5">{flights.length} flights tracked</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
            <Upload className="w-4 h-4" /> Bulk Import
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Track Flight
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-600">Loading...</div>
      ) : flights.length === 0 ? (
        <div className="text-center py-16">
          <Plane className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No flights tracked yet</p>
          <button onClick={() => setShowAdd(true)} className="text-blue-400 text-sm hover:underline">Add your first flight</button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Flight</th>
                <th className="text-left px-5 py-3">Route</th>
                <th className="text-left px-5 py-3">Departure</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Events</th>
                <th className="text-left px-5 py-3">Orders</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {flights.map((f: any) => (
                <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/flights/${f.id}`} className="font-bold hover:text-blue-400 transition-colors">{f.flightIata}</Link>
                    <div className="text-xs text-gray-500 mt-0.5">{f.airline}</div>
                    {f.pollingPaused && <div className="text-[10px] text-amber-500 mt-0.5">paused</div>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium">{f.origin}</span>
                    <span className="text-gray-600 mx-1">&rarr;</span>
                    <span className="font-medium">{f.destination}</span>
                  </td>
                  <td className="px-5 py-4">
                    {f.depScheduled ? (
                      <div>
                        <div>{new Date(f.depScheduled).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                        <div className="text-xs text-gray-500">{new Date(f.depScheduled).toUTCString().slice(17,22)} UTC</div>
                      </div>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={f.status} /></td>
                  <td className="px-5 py-4"><span className="text-gray-400">{f._count?.events ?? 0}</span></td>
                  <td className="px-5 py-4">
                    {(f.orderFlights ?? []).length === 0 ? (
                      <span className="text-gray-700">——</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {(f.orderFlights ?? []).map((of: any) => (
                          <Link
                            key={of.id}
                            href={`/dashboard/flights/${f.id}`}
                            className="text-xs text-sky-400/80 font-mono hover:text-sky-300 transition-colors truncate max-w-[140px] block"
                            onClick={e => e.stopPropagation()}
                          >
                            {of.order?.reference || '—'}
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => togglePause(f.id, f.pollingPaused)}
                        disabled={toggling === f.id}
                        title={f.pollingPaused ? 'Resume polling' : 'Pause polling'}
                        className="text-gray-600 hover:text-amber-400 transition-colors disabled:opacity-30"
                      >
                        {f.pollingPaused
                          ? <PlayCircle className="w-4 h-4" />
                          : <PauseCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => refresh(f.id)}
                        disabled={refreshing === f.id}
                        title="Refresh now"
                        className="text-gray-600 hover:text-white transition-colors disabled:opacity-30"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing === f.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => deleteFlight(f.id, f.flightIata)}
                        disabled={deleting === f.id}
                        title="Delete flight"
                        className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showAdd && <AddFlightModal onClose={() => setShowAdd(false)} onAdded={load} />}
      {showBulk && <BulkImportModal onClose={() => setShowBulk(false)} onAdded={load} />}
    </div>
  );
}
