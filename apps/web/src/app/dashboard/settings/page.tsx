import { createClient } from '@/utils/supabase/server'
import { simulateEvent } from '@/app/actions/simulator'
import { Beaker } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = createClient()
  
  // Only for demonstration, we'll fetch all active flights
  const { data: flights } = await supabase.from('flights').select('id, flight_iata, flight_date_local').eq('is_active', true)

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Beaker className="w-5 h-5 mr-2 text-indigo-600" />
          Event Simulator (Admin Only)
        </h2>
        <p className="text-gray-600 mb-6">Use this tool to test notification flows by injecting simulated flight events.</p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Flight</label>
            <select name="flightId" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 p-2">
              {flights?.map(f => (
                <option key={f.id} value={f.id}>{f.flight_iata} - {f.flight_date_local}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              formAction={async (formData) => {
                'use server'
                const id = formData.get('flightId') as string
                await simulateEvent(id, 'DELAY_30', 45)
              }}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
            >
              Simulate 30m Delay
            </button>
            <button 
              formAction={async (formData) => {
                'use server'
                const id = formData.get('flightId') as string
                await simulateEvent(id, 'GATE_CHANGE', 'B22')
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Simulate Gate Change
            </button>
            <button 
              formAction={async (formData) => {
                'use server'
                const id = formData.get('flightId') as string
                await simulateEvent(id, 'CANCELLED', 'cancelled')
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Simulate Cancellation
            </button>
            <button 
              formAction={async (formData) => {
                'use server'
                const id = formData.get('flightId') as string
                await simulateEvent(id, 'ARRIVED', new Date().toISOString())
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Simulate Arrival
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Organization Settings</h2>
        <p className="text-gray-500 italic">Coming soon: Whitelabeling and Branding controls.</p>
      </div>
    </div>
  )
}
