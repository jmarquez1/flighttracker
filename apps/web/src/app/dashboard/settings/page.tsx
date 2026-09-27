'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const ALL_EVENT_TYPES = [
  { type: 'CANCELLED', label: 'Flight Cancelled', description: 'Flight is cancelled by the airline' },
  { type: 'DIVERTED', label: 'Flight Diverted', description: 'Flight diverted to different airport' },
  { type: 'DELAY_30', label: 'Delay 30+ min', description: 'Departure delayed 30 minutes or more' },
  { type: 'DELAY_60', label: 'Delay 60+ min', description: 'Departure delayed 60 minutes or more' },
  { type: 'DELAY_120', label: 'Delay 2+ hours', description: 'Departure delayed 2 hours or more' },
  { type: 'GATE_CHANGE', label: 'Gate Changed', description: 'Departure gate has changed' },
  { type: 'TERMINAL_CHANGE', label: 'Terminal Changed', description: 'Departure terminal has changed' },
  { type: 'SCHEDULE_CHANGE', label: 'Schedule Changed', description: 'Departure time has changed (even months ahead)' },
  { type: 'DEPARTED', label: 'Flight Departed', description: 'Flight has taken off' },
  { type: 'ARRIVED', label: 'Flight Arrived', description: 'Flight has landed at destination' },
  { type: 'STATUS_CHANGE', label: 'Status Update', description: 'Any other status change' },
];

export default function SettingsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('STAFF');
  const [addingRecipient, setAddingRecipient] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/alert-rules').then(r => r.json()),
      fetch('/api/settings/recipients').then(r => r.json())
    ]).then(([r, rec]) => { setRules(r); setRecipients(rec); }).finally(() => setLoading(false));
  }, []);

  function getRule(eventType: string) {
    return rules.find(r => r.eventType === eventType) || { eventType, staffEnabled: true, customerEnabled: false };
  }

  async function toggleRule(eventType: string, field: 'staffEnabled' | 'customerEnabled', value: boolean) {
    setSaving(eventType + field);
    const rule = getRule(eventType);
    await fetch('/api/settings/alert-rules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rule, [field]: value })
    });
    setRules(await fetch('/api/settings/alert-rules').then(r => r.json()));
    setSaving(null);
  }

  async function addRecipient() {
    if (!newEmail) return;
    setAddingRecipient(true);
    try {
      await fetch('/api/settings/recipients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName, type: newType })
      });
      setNewEmail(''); setNewName('');
      setRecipients(await fetch('/api/settings/recipients').then(r => r.json()));
    } finally { setAddingRecipient(false); }
  }

  async function removeRecipient(id: string) {
    await fetch(`/api/settings/recipients/${id}`, { method: 'DELETE' });
    setRecipients(r => r.filter((x: any) => x.id !== id));
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure alert rules and notification recipients</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-1">Notification Recipients</h2>
        <p className="text-xs text-gray-500 mb-5">Staff get all alerts immediately. Customer alerts are time-gated per rules below.</p>
        <div className="space-y-2 mb-4">
          {recipients.length === 0 && <p className="text-sm text-gray-600">No recipients yet.</p>}
          {recipients.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
              <div className="flex-1">
                <span className="text-sm font-medium">{r.email}</span>
                {r.name && <span className="text-xs text-gray-500 ml-2">{r.name}</span>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'STAFF' ? 'bg-blue-500/20 text-blue-300' : r.type === 'OPS' ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'}`}>{r.type}</span>
              <button onClick={() => removeRecipient(r.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="ops@travelbiuro.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="w-32">
            <label className="text-xs text-gray-500 mb-1 block">Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ops team"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="w-28">
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <select value={newType} onChange={e => setNewType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="STAFF">Staff</option>
              <option value="OPS">Ops</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
          <button onClick={addRecipient} disabled={addingRecipient || !newEmail}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-1">Alert Rules</h2>
        <p className="text-xs text-gray-500 mb-5">Toggle which events trigger staff and customer notifications.</p>
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_80px_100px] gap-4 px-3 py-1 text-xs text-gray-600 uppercase tracking-wide">
            <span>Event</span><span className="text-center">Staff</span><span className="text-center">Customer</span>
          </div>
          {ALL_EVENT_TYPES.map(({ type, label, description }) => {
            const rule = getRule(type);
            return (
              <div key={type} className="grid grid-cols-[1fr_80px_100px] gap-4 items-center px-3 py-3 rounded-xl hover:bg-gray-800/50 transition-colors">
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-gray-600">{description}</div>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => toggleRule(type, 'staffEnabled', !rule.staffEnabled)} disabled={saving === type + 'staffEnabled'}
                    className={`w-10 h-5 rounded-full transition-colors relative ${rule.staffEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${rule.staffEnabled ? 'left-5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => toggleRule(type, 'customerEnabled', !rule.customerEnabled)} disabled={saving === type + 'customerEnabled'}
                    className={`w-10 h-5 rounded-full transition-colors relative ${rule.customerEnabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${rule.customerEnabled ? 'left-5' : 'left-0.5'}`}></div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
