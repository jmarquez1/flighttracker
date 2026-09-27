'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plane, AlertTriangle, Plus, Trash2, ChevronRight, Search } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  BOARDING:  'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  ACTIVE:    'bg-green-500/20 text-green-300 border border-green-500/30',
  LANDED:    'bg-gray-500/20 text-gray-400 border border-gray-600/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  DIVERTED:  'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  UNKNOWN:   'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
};

const EVENT_LABELS: Record<string, string> = {
  CANCELLED: 'Cancelled', DIVERTED: 'Diverted',
  DELAY_30: 'Delay 30+', DELAY_60: 'Delay 60+', DELAY_120: 'Delay 2h+',
  GATE_ASSIGNED: 'Gate Assigned',
  GATE_CHANGE: 'Gate Change', TERMINAL_CHANGE: 'Terminal Change',
  SCHEDULE_CHANGE: 'Schedule Change', DEPARTED: 'Departed',
  ARRIVED: 'Arrived', LANDED: 'Landed', STATUS_CHANGE: 'Status Update',
};

const EVENT_DOT: Record<string, string> = {
  CANCELLED: 'bg-red-400', DIVERTED: 'bg-orange-400',
  DELAY_30: 'bg-yellow-400', DELAY_60: 'bg-amber-400', DELAY_120: 'bg-red-400',
  GATE_ASSIGNED: 'bg-sky-400',
  GATE_CHANGE: 'bg-blue-400', TERMINAL_CHANGE: 'bg-indigo-400',
  SCHEDULE_CHANGE: 'bg-purple-400', DEPARTED: 'bg-green-400',
  ARRIVED: 'bg-teal-400', LANDED: 'bg-gray-400', STATUS_CHANGE: 'bg-gray-500',
};

function AddFlightModal({ orderId, allFlights, linkedIds, onClose, onAdded }: {
  orderId: string; allFlights: any[]; linkedIds: Set<string>; onClose: () => void; onAdded: () => void;
}) {
  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [iata, setIata] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [selectedFlight, setSelectedFlight] = useState('');
  const [linking, setLinking] = useState(false);

  const available = allFlights.filter(f => !linkedIds.has(f.id));

  async function search() {
    if (!iata || !date) return;
    setSearching(true); setError(''); setPreview(null);
    try {
      const r = await fetch(`/api/flights/preview?iata=${iata.toUpperCase()}&date=${date}`);
      if (!r.ok) { setError('Flight not found. Check the flight number and date.'); return; }
      setPreview(await r.json());
    } catch { setError('API error. Try again.'); }
    finally { setSearching(false); }
  }

  async function addAndLink() {
    setAdding(true); setError('');
    try {
      const r = await fetch(`/api/orders/${orderId}/add-flight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flightIata: iata.toUpperCase(), flightDate: date }),
      });
      if (!r.ok) throw new Error('Failed');
      onAdded(); onClose();
    } catch { setError('Could not add flight.'); }
    finally { setAdding(false); }
  }

  async function linkExisting() {
    if (!selectedFlight) return;
    setLinking(true);
    await fetch(`/api/orders/${orderId}/flights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId: selectedFlight }),
    });
    setLinking(false); onAdded(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold mb-4">Add Flight to Order</h2>

        <div className="flex bg-gray-800 rounded-lg p-1 mb-5 gap-1">
          <button onClick={() => setTab('new')} className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${tab === 'new' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
            New Flight
          </button>
          <button onClick={() => setTab('existing')} className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${tab === 'existing' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
            Already Tracked ({available.length})
          </button>
        </div>

        {tab === 'new' ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Flight Number</label>
                <input value={iata} onChange={e => setIata(e.target.value.toUpperCase())}
                  placeholder="FR4052" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  onKeyDown={e => e.key === 'Enter' && search()} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <button onClick={search} disabled={searching || !iata}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
              <Search className="w-4 h-4" />{searching ? 'Searching...' : 'Search Flight'}
            </button>
            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            {preview && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{preview.flightIata}</span>
                  <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_COLORS[preview.status] || STATUS_COLORS.UNKNOWN)}>{preview.status}</span>
                </div>
                <div className="text-xs text-gray-400 mb-3">{preview.airline}</div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-center flex-1">
                    <div className="font-bold text-white">{preview.origin}</div>
                    <div className="text-xs text-gray-500">{preview.originCity}</div>
                  </div>
                  <Plane className="w-4 h-4 text-gray-600" />
                  <div className="text-center flex-1">
                    <div className="font-bold text-white">{preview.destination}</div>
                    <div className="text-xs text-gray-500">{preview.destinationCity}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {preview.depScheduled && (
                    <div className="text-gray-400">Dep: <span className="text-gray-200">{new Date(preview.depScheduled).toUTCString().slice(0,22)} UTC</span></div>
                  )}
                  {preview.arrScheduled && (
                    <div className="text-gray-400">Arr: <span className="text-gray-200">{new Date(preview.arrScheduled).toUTCString().slice(0,22)} UTC</span></div>
                  )}
                  {preview.terminalDep && (
                    <div className="text-gray-400">Terminal: <span className="text-blue-300 font-semibold">{preview.terminalDep}</span></div>
                  )}
                  {preview.gateDep && (
                    <div className="text-gray-400">Gate: <span className="text-blue-300 font-semibold">{preview.gateDep}</span></div>
                  )}
                  {preview.delayDepMin && (
                    <div className="col-span-2 text-orange-400 font-medium">Delay: {preview.delayDepMin} min</div>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={addAndLink} disabled={!preview || adding}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg py-2 text-sm font-medium transition-colors">
                {adding ? 'Adding...' : 'Add & Link'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {available.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">All tracked flights are already linked to this order.</p>
            ) : (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {available.map((f: any) => (
                  <label key={f.id} className={'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ' + (selectedFlight === f.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600')}>
                    <input type="radio" name="flight" value={f.id} checked={selectedFlight === f.id} onChange={() => setSelectedFlight(f.id)} className="sr-only" />
                    <Plane className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{f.flightIata}</span>
                      <span className="text-gray-500 ml-2 text-xs">{f.origin} &rarr; {f.destination} &middot; {f.flightDate}</span>
                      {(f.terminalDep || f.gateDep) && (
                        <span className="ml-2 text-xs text-blue-400">{f.terminalDep ? `T${f.terminalDep}` : ''}{f.gateDep ? ` G${f.gateDep}` : ''}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={linkExisting} disabled={!selectedFlight || linking}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg py-2 text-sm font-medium transition-colors">
                {linking ? 'Linking...' : 'Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allFlights, setAllFlights] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    const [o, f] = await Promise.all([
      fetch('/api/orders/' + id).then(r => r.json()),
      fetch('/api/flights').then(r => r.json()),
    ]);
    setOrder(o);
    setAllFlights(f);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function unlinkFlight(flightId: string) {
    await fetch('/api/orders/' + id + '/flights/' + flightId, { method: 'DELETE' });
    load();
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!order || order.error) return <div className="p-8 text-gray-500">Order not found.</div>;

  const linkedFlightIds = new Set<string>(order.orderFlights.map((of: any) => of.flightId as string));
  const hasIssue = order.orderFlights.some((of: any) => ['CANCELLED', 'DIVERTED'].includes(of.flight?.status));

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{order.reference}</h1>
            {hasIssue && (
              <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Action needed
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            {[order.groupName, order.customerName, order.customerEmail].filter(Boolean).join(' \u00b7 ') || 'No details'}
          </p>
          {order.notes && <p className="text-xs text-gray-600 mt-1">{order.notes}</p>}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Linked Flights</h2>
            <p className="text-xs text-gray-500 mt-0.5">{order.orderFlights.length} flight{order.orderFlights.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Flight
          </button>
        </div>

        {order.orderFlights.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
            <Plane className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No flights linked yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {order.orderFlights.map((of: any) => {
              const f = of.flight;
              const isIssue = ['CANCELLED', 'DIVERTED'].includes(f?.status);
              return (
                <div key={of.id} className={'border rounded-xl p-4 ' + (isIssue ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-800/50 border-gray-700/50')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + (isIssue ? 'bg-red-500/20' : 'bg-gray-700')}>
                        {isIssue ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Plane className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{f?.flightIata}</span>
                          <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_COLORS[f?.status] || STATUS_COLORS.UNKNOWN)}>
                            {f?.status}
                          </span>
                          {f?.terminalDep && (
                            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                              T{f.terminalDep}
                            </span>
                          )}
                          {f?.gateDep && (
                            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                              G{f.gateDep}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {f?.origin} &rarr; {f?.destination} &middot; {f?.flightDate}
                          {f?.airline ? ' \u00b7 ' + f.airline : ''}
                        </div>
                        {f?.depScheduled && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            Dep: {new Date(f.depScheduled).toUTCString().slice(0,22)} UTC
                            {f?.delayDepMin ? <span className="text-orange-400 ml-2">{f.delayDepMin}m delay</span> : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={'/dashboard/flights/' + f?.id}
                        className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-0.5 transition-colors">
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                      <button onClick={() => unlinkFlight(f?.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {f?.events?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700/30 space-y-1.5">
                      {f.events.slice(0, 3).map((evt: any) => (
                        <div key={evt.id} className="flex items-center gap-2 text-xs">
                          <div className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + (EVENT_DOT[evt.eventType] || 'bg-gray-500')}></div>
                          <span className="text-gray-400 font-medium">{EVENT_LABELS[evt.eventType] || evt.eventType}</span>
                          {evt.oldValue !== null && <span className="text-gray-700 line-through">{JSON.stringify(evt.oldValue)}</span>}
                          <span className="text-gray-300">{JSON.stringify(evt.newValue)}</span>
                          <span className="text-gray-700 ml-auto">{new Date(evt.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <AddFlightModal
          orderId={id}
          allFlights={allFlights}
          linkedIds={linkedFlightIds}
          onClose={() => setShowModal(false)}
          onAdded={load}
        />
      )}
    </div>
  );
}
