import { createClient } from '@/utils/supabase/server'
import { Plus, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TripsPage() {
  try {
    const supabase = createClient()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Supabase URL is not configured')
    }

    const { data: trips, error } = await supabase
      .from('trips')
      .select('*, organizations(name)')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Trips Command</h1>
          <button className="bg-indigo-600 text-white px-6 py-2 font-mono text-sm hover:bg-indigo-700 transition-all">
            + NEW_TRIP
          </button>
        </div>

        <div className="border border-white/10 bg-white/5 overflow-hidden">
          <table className="min-w-full divide-y divide-white/10 font-mono text-xs uppercase">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-indigo-400">Group Name</th>
                <th className="px-6 py-4 text-left text-indigo-400">Status</th>
                <th className="px-6 py-4 text-right text-indigo-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trips?.map((trip) => (
                <tr key={trip.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold">{trip.group_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a href={`/dashboard/trips/${trip.id}`} className="text-white hover:text-indigo-400 transition-colors">[ VIEW ]</a>
                  </td>
                </tr>
              ))}
              {(!trips || trips.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-gray-500 italic">
                    NO_DATA_FOUND // INITIALIZE_SYSTEM_REQUIRED
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  } catch (err: any) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2 uppercase tracking-tighter">System Error</h2>
        <p className="text-gray-500 font-mono text-sm max-w-md">
          Failed to establish connection with the Command Center. 
          Please verify your Supabase environment variables in Railway.
        </p>
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px]">
          ERROR_CODE: {err.message || 'UNKNOWN_EXCEPTION'}
        </div>
      </div>
    )
  }
}
