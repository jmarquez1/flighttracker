import { createClient } from '@supabase/supabase-js'
import { Plane, Calendar, MapPin, Clock } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function PublicTripPortal({ params }: { params: { token: string } }) {
  // Use anon client for public access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: trip } = await supabase
    .from('trips')
    .select('*, organizations(name, logo_url, brand_color)')
    .eq('public_token', params.token)
    .single()

  if (!trip) {
    notFound()
  }

  const { data: flights } = await supabase
    .from('flights')
    .select('*')
    .eq('trip_id', trip.id)
    .eq('is_active', true)
    .order('dep_scheduled', { ascending: true })

  const brandColor = trip.organizations?.brand_color || '#4f46e5'

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header / Branding */}
      <header className="bg-white shadow-sm border-b" style={{ borderTop: `4px solid ${brandColor}` }}>
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{trip.group_name}</h1>
            <p className="text-sm text-gray-500">Trip updates by {trip.organizations?.name}</p>
          </div>
          {trip.organizations?.logo_url && (
            <img src={trip.organizations.logo_url} alt="Logo" className="h-10 w-auto" />
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="space-y-6">
          {flights?.map((flight) => (
            <div key={flight.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center">
                    <Plane className="w-5 h-5 text-indigo-600 mr-2" />
                    <span className="text-lg font-bold">{flight.flight_iata}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    flight.flight_status === 'active' ? 'bg-green-100 text-green-800' :
                    flight.flight_status === 'landed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {flight.flight_status || 'Scheduled'}
                  </span>
                </div>

                <div className="flex justify-between items-center relative">
                  {/* Origin */}
                  <div className="flex-1">
                    <div className="text-3xl font-black text-gray-900">{flight.dep_iata}</div>
                    <div className="text-xs text-gray-500 uppercase font-medium">Departure</div>
                    <div className="mt-2 flex items-center text-sm font-semibold">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {flight.dep_scheduled ? new Date(flight.dep_scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="px-4 flex flex-col items-center">
                    <div className="h-0.5 w-16 bg-gray-200 relative">
                      <div className="absolute right-0 -top-1">
                        <Plane className="w-3 h-3 text-gray-300 transform rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex-1 text-right">
                    <div className="text-3xl font-black text-gray-900">{flight.arr_iata}</div>
                    <div className="text-xs text-gray-500 uppercase font-medium">Arrival</div>
                    <div className="mt-2 flex items-center justify-end text-sm font-semibold">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {flight.arr_scheduled ? new Date(flight.arr_scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                  </div>
                </div>

                {/* Details Bar */}
                <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600 mr-1">Gate:</span>
                    <span className="font-bold">{flight.gate_dep || '-'}</span>
                  </div>
                  <div className="flex items-center text-sm justify-end">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600 mr-1">Delay:</span>
                    <span className={`font-bold ${flight.delay_dep_min ? 'text-red-500' : 'text-green-600'}`}>
                      {flight.delay_dep_min ? `${flight.delay_dep_min}m` : 'On Time'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(!flights || flights.length === 0) && (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
              <Plane className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No flights currently scheduled for this trip.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 text-center text-xs text-gray-400">
        <p>Powered by Flight Tracker SaaS</p>
      </footer>
    </div>
  )
}
