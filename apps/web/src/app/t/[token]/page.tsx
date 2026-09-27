import { PrismaClient } from '@flight-tracker/db';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: 'Scheduled',  color: 'text-blue-300',   bg: 'bg-blue-500/10 border-blue-500/20' },
  BOARDING:  { label: 'Boarding',   color: 'text-sky-300',    bg: 'bg-sky-500/10 border-sky-500/20' },
  ACTIVE:    { label: 'In Flight',  color: 'text-green-300',  bg: 'bg-green-500/10 border-green-500/20' },
  LANDED:    { label: 'Landed',     color: 'text-gray-300',   bg: 'bg-gray-500/10 border-gray-500/20' },
  CANCELLED: { label: 'Cancelled',  color: 'text-red-300',    bg: 'bg-red-500/10 border-red-500/20' },
  DIVERTED:  { label: 'Diverted',   color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/20' },
  UNKNOWN:   { label: 'Unknown',    color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/20' },
};

function fmtDt(dt: Date | null | undefined): string {
  if (!dt) return '—';
  return new Date(dt).toUTCString().replace(/:\d\d GMT$/, ' UTC');
}

export default async function PublicTripPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Token is the order ID (public, no auth required — order IDs are opaque UUIDs)
  const order = await prisma.order.findUnique({
    where: { id: token },
    include: {
      orderFlights: {
        include: {
          flight: {
            include: { events: { orderBy: { createdAt: 'desc' }, take: 10 } }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!order) notFound();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Travel Biuro</div>
            <div className="font-bold text-lg">Flight Status</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Booking reference</div>
            <div className="font-mono font-bold text-blue-400">{order.reference}</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {order.orderFlights.length === 0 ? (
          <div className="text-center py-16 text-gray-600">No flights linked to this booking.</div>
        ) : (
          order.orderFlights.map(({ flight }: any) => {
            const cfg = STATUS_LABEL[flight.status] || STATUS_LABEL.UNKNOWN;
            const isLate = flight.delayDepMin && flight.delayDepMin > 0;

            return (
              <div key={flight.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {/* Flight banner */}
                <div className="bg-gray-800 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xl tracking-wide">{flight.flightIata}</div>
                    <div className="text-sm text-gray-400 mt-0.5">{flight.airline}</div>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Route */}
                <div className="bg-gray-850 border-b border-gray-800 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-3xl font-black tracking-wider">{flight.origin || '---'}</div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{flight.originCity || ''}</div>
                    </div>
                    <div className="text-2xl text-gray-700">&#9992;</div>
                    <div className="text-center">
                      <div className="text-3xl font-black tracking-wider">{flight.destination || '---'}</div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{flight.destinationCity || ''}</div>
                    </div>
                  </div>
                </div>

                {/* Flight details */}
                <div className="px-5 py-4 space-y-2">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sched. Departure</span>
                      <span className="font-semibold">{fmtDt(flight.depScheduled)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sched. Arrival</span>
                      <span className="font-semibold">{fmtDt(flight.arrScheduled)}</span>
                    </div>
                    {flight.depEstimated && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Est. Departure</span>
                        <span className={`font-semibold ${isLate ? 'text-orange-400' : ''}`}>{fmtDt(flight.depEstimated)}</span>
                      </div>
                    )}
                    {flight.arrEstimated && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Est. Arrival</span>
                        <span className="font-semibold">{fmtDt(flight.arrEstimated)}</span>
                      </div>
                    )}
                    {flight.terminalDep && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Terminal</span>
                        <span className="font-bold text-indigo-300">T{flight.terminalDep}</span>
                      </div>
                    )}
                    {flight.gateDep && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gate</span>
                        <span className="font-bold text-blue-300">{flight.gateDep}</span>
                      </div>
                    )}
                    {isLate && (
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-500">Delay</span>
                        <span className="font-bold text-orange-400">+{flight.delayDepMin} min</span>
                      </div>
                    )}
                  </div>

                  {/* Recent events */}
                  {flight.events.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Recent Updates</div>
                      <div className="space-y-2">
                        {flight.events.slice(0, 5).map((evt: any) => (
                          <div key={evt.id} className="flex items-start gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-300">{evt.eventType.replace(/_/g, ' ')}</span>
                              {evt.newValue && <span className="text-gray-500 ml-2">→ {evt.newValue}</span>}
                            </div>
                            <div className="text-xs text-gray-600 flex-shrink-0">
                              {new Date(evt.createdAt).toUTCString().slice(5, 22)} UTC
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <p className="text-center text-xs text-gray-700 pt-4">
          Powered by Travel Biuro &middot; Flight data updates automatically
        </p>
      </div>
    </div>
  );
}
