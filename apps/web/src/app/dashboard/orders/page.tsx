'use client';
import { useEffect, useState } from 'react';
import { Package, Plus, Plane, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-500', ACTIVE: 'bg-green-500', LANDED: 'bg-gray-500',
  CANCELLED: 'bg-red-500', DIVERTED: 'bg-orange-500', UNKNOWN: 'bg-yellow-500',
};

function AddOrderModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ reference: '', groupName: '', customerName: '', customerEmail: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!form.reference) { setError('Reference is required'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error('Failed');
      onAdded(); onClose();
    } catch { setError('Could not create order.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-5">New Order</h2>
        <div className="space-y-3">
          {[
            { key: 'reference', label: 'Order Reference *', placeholder: 'TB-2026-001' },
            { key: 'groupName', label: 'Group Name', placeholder: 'School Trip Berlin' },
            { key: 'customerName', label: 'Customer Name', placeholder: 'John Smith' },
            { key: 'customerEmail', label: 'Customer Email', placeholder: 'john@example.com' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-gray-400 mb-1 block">{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional notes..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setLoading(true);
    try { setOrders(await (await fetch('/api/orders')).json()); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} orders</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl">
          <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No orders yet</p>
          <button onClick={() => setShowAdd(true)} className="text-blue-400 text-sm hover:underline">Create first order</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((o: any) => {
            const hasIssue = o.orderFlights?.some((of: any) => ['CANCELLED', 'DIVERTED'].includes(of.flight?.status));
            return (
              <Link key={o.id} href={`/dashboard/orders/${o.id}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 flex items-center gap-4 transition-colors group">
                <div className="flex-shrink-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${hasIssue ? 'bg-red-500/20' : 'bg-gray-800'}`}>
                    {hasIssue ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Package className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold group-hover:text-blue-400 transition-colors">{o.reference}</span>
                    {hasIssue && <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">Action needed</span>}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{o.groupName || o.customerName || '—'}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {o.orderFlights?.slice(0, 4).map((of: any) => (
                    <div key={of.id} className="flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-lg text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[of.flight?.status] || 'bg-gray-600'}`}></div>
                      <Plane className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-300">{of.flight?.flightIata}</span>
                    </div>
                  ))}
                  {o.orderFlights?.length > 4 && <span className="text-xs text-gray-600">+{o.orderFlights.length - 4}</span>}
                  {o.orderFlights?.length === 0 && <span className="text-xs text-gray-600">No flights</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showAdd && <AddOrderModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}
