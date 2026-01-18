import { createClient } from '@/utils/supabase/server'

export default async function EventsPage() {
  const supabase = createClient()
  
  const { data: events, error } = await supabase
    .from('flight_events')
    .select('*, flights(flight_iata, dep_iata, arr_iata)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recent Events</h1>
      </div>

      {error && <div className="text-red-500">Error loading events: {error.message}</div>}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events?.map((event) => (
              <tr key={event.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(event.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {event.flights?.flight_iata} ({event.flights?.dep_iata}→{event.flights?.arr_iata})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    event.event_type.includes('DELAY') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {event.event_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {event.new_state ? JSON.stringify(event.new_state) : '-'}
                </td>
              </tr>
            ))}
            {(!events || events.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  No events recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
