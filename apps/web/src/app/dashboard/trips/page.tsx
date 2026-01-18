import { createClient } from '@/utils/supabase/server'
import { Plus } from 'lucide-react'

export default async function TripsPage() {
  const supabase = createClient()
  
  const { data: trips, error } = await supabase
    .from('trips')
    .select('*, organizations(name)')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700">
          <Plus className="w-5 h-5 mr-2" />
          New Trip
        </button>
      </div>

      {error && <div className="text-red-500">Error loading trips: {error.message}</div>}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trips?.map((trip) => (
              <tr key={trip.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trip.group_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trip.trip_code || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trip.start_date} to {trip.end_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    trip.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {trip.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href={`/dashboard/trips/${trip.id}`} className="text-indigo-600 hover:text-indigo-900">View</a>
                </td>
              </tr>
            ))}
            {(!trips || trips.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No trips found. Create your first trip to start tracking flights.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
