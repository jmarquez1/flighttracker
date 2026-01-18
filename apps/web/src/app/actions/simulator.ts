'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { EventType } from '@flight-tracker/shared'

export async function simulateEvent(flightId: string, eventType: EventType, newState: any) {
  const supabase = createClient()
  
  // 1. Get the flight to ensure it exists and we have access
  const { data: flight } = await supabase.from('flights').select('*').eq('id', flightId).single()
  if (!flight) throw new Error('Flight not found')

  // 2. Insert a fake event
  const eventKey = `${flightId}:SIMULATED:${eventType}:${Date.now()}`
  const { data: event, error } = await supabase
    .from('flight_events')
    .insert({
      flight_id: flightId,
      event_type: eventType,
      event_key: eventKey,
      old_state: flight.flight_status,
      new_state: newState
    })
    .select()
    .single()

  if (error) throw error

  // 3. Update the flight status to match the simulated event
  if (eventType === 'STATUS_CHANGE') {
    await supabase.from('flights').update({ flight_status: newState }).eq('id', flightId)
  } else if (eventType === 'GATE_CHANGE') {
    await supabase.from('flights').update({ gate_dep: newState }).eq('id', flightId)
  } else if (eventType === 'CANCELLED') {
    await supabase.from('flights').update({ flight_status: 'cancelled' }).eq('id', flightId)
  }

  console.log(`Simulated event ${eventType} for flight ${flightId}`)
  
  revalidatePath('/dashboard/events')
  revalidatePath('/dashboard/flights')
  
  return { success: true, eventId: event.id }
}
