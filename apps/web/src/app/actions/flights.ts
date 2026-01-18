import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function refreshFlight(flightId: string) {
  const supabase = createClient()
  
  // This would ideally call an internal API or a shared function
  // For the MVP, we can just update a 'force_check' flag or similar
  // Or we can implement the logic here directly using a service role client if needed
  
  console.log(`Manual refresh requested for flight: ${flightId}`)
  
  // In a real implementation, this would call the Aviationstack API and update the DB
  // For now, we'll just update the last_checked_at to show something happened
  await supabase
    .from('flights')
    .update({ last_checked_at: new Date().toISOString() })
    .eq('id', flightId)

  revalidatePath('/dashboard/flights')
  return { success: true }
}
