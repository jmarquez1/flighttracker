import { createClient } from '@/utils/supabase/server'
import { Plus, RefreshCw } from 'lucide-react'

export default async function FlightsPage() {
  const supabase = createClient()
  
  const { data: flights, error } = await supabase
    .from('flights')
    .select('*, trips(group_name)')
    .eq('is_active', true)
    .order('next_check_at', { ascending: true })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Active Flights</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700">
          <Plus className="w-5 h-5 mr-2" />
          Add Flight
        </button>
      </div>

      {error && <div className="text-red-500">Error loading flights: {error.message}</div>}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Check</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flights?.map((flight) => (
              <tr key={flight.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{flight.flight_iata}</div>
                  <div className="text-xs text-gray-500">{flight.flight_date_local}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {flight.dep_iata} → {flight.arr_iata}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flight.trips?.group_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase`}>
                    {flight.flight_status || 'SCHEDULED'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {flight.next_check_at ? new Date(flight.next_check_at).toLocaleTimeString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <a href={`/dashboard/flights/${flight.id}`} className="text-indigo-600 hover:text-indigo-900">Details</a>
                </td>
              </tr>
            ))}
            {(!flights || flights.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No active flights being tracked.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
