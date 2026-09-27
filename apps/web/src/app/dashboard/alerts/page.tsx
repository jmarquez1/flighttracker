'use client';
import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle, XCircle, Clock, Search, X } from 'lucide-react';
import Link from 'next/link';

export default function AlertsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetch('/api/notifications').then(r => r.json());
      setNotifications(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const q = search.toLowerCase().trim();
  const filtered = notifications.filter(n => {
    if (filterStatus && n.status !== filterStatus) return false;
    if (q) {
      const subject = (n.subject || '').toLowerCase();
      const email   = (n.recipientEmail || '').toLowerCase();
      const flight  = (n.flight?.flightIata || '').toLowerCase();
      const ref     = (n.orderRef || n.subject || '').toLowerCase();
      if (!subject.includes(q) && !email.includes(q) && !flight.includes(q) && !ref.includes(q)) return false;
    }
    return true;
  });

  const sentCount   = notifications.filter(n => n.status === 'SENT').length;
  const failedCount = notifications.filter(n => n.status === 'FAILED').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alert Log</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {sentCount} sent &middot; {failedCount > 0 && <span className="text-red-400">{failedCount} failed &middot; </span>}{notifications.length} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Flight, email, subject, order ref..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-200 placeholder-gray-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>
        {(search || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); }} className="text-sm text-gray-500 hover:text-white">
            Clear
          </button>
        )}
        <span className="text-xs text-gray-600 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl">
          <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No notifications sent yet</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm">No results match your filters</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Flight</th>
                <th className="text-left px-5 py-3">Recipient</th>
                <th className="text-left px-5 py-3">Subject</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Sent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n: any) => (
                <tr key={n.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    {n.flight?.id ? (
                      <Link href={`/dashboard/flights/${n.flight.id}`} className="font-bold hover:text-blue-400 transition-colors">
                        {n.flight.flightIata}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400">{n.recipientEmail}</td>
                  <td className="px-5 py-3 text-gray-300 max-w-xs">
                    <span className="block truncate" title={n.subject}>{n.subject || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    {n.status === 'SENT'    && <span className="inline-flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Sent</span>}
                    {n.status === 'FAILED'  && (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs" title={n.error || ''}>
                        <XCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                    {n.status === 'PENDING' && <span className="inline-flex items-center gap-1 text-yellow-400 text-xs"><Clock className="w-3.5 h-3.5" /> Pending</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {n.sentAt ? new Date(n.sentAt).toUTCString().replace(/:\d\d GMT$/, ' UTC') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
