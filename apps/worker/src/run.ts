import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { FlightState, FlightStatus, EventType } from '@flight-tracker/shared';
import { AviationstackClient } from './lib/aviationstack';
import { detectEvents } from './lib/events';
import { NotificationService } from './lib/notifications';
import { formatNotification } from './lib/formatter';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AVIATIONSTACK_KEY = process.env.AVIATIONSTACK_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const aviationstack = new AviationstackClient(AVIATIONSTACK_KEY);
const notificationService = new NotificationService();

function computeHash(state: FlightState): string {
  return crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');
}

function computeNextCheck(state: FlightState): Date {
  const now = new Date();
  const depTime = new Date(state.dep_estimated || state.dep_scheduled || now);
  const arrTime = new Date(state.arr_estimated || state.arr_scheduled || now);
  
  const diffToDep = depTime.getTime() - now.getTime();
  const diffToArr = arrTime.getTime() - now.getTime();

  // Smart Polling Logic
  if (state.flight_status === 'landed' || state.flight_status === 'cancelled') {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Check again in 24h (or mark inactive)
  }

  if (diffToDep > 6 * 60 * 60 * 1000) {
    // More than 6h before departure
    return new Date(depTime.getTime() - 6 * 60 * 60 * 1000);
  } else if (diffToDep > -2 * 60 * 60 * 1000) {
    // Within 6h before to 2h after departure
    return new Date(now.getTime() + 15 * 60 * 1000);
  } else if (diffToArr > -2 * 60 * 60 * 1000) {
    // Within 2h after departure to 2h after arrival
    return new Date(now.getTime() + 20 * 60 * 1000);
  }

  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

async function sendNotifications(event: any, flight: any) {
  // 1. Fetch trip and group info
  const { data: trip } = await supabase.from('trips').select('group_name').eq('id', flight.trip_id).single();
  const groupName = trip?.group_name || 'Your Trip';

  // 2. Fetch followers
  const { data: followers } = await supabase
    .from('flight_followers')
    .select('*, contacts(*)')
    .eq('flight_id', flight.id);

  // 3. Format message
  const { subject, body } = formatNotification(event.event_type as EventType, flight.flight_iata, groupName, event.new_state);

  // 4. Send to each follower
  for (const follower of followers || []) {
    const contact = follower.contacts;
    if (!contact) continue;

    if (follower.notify_email && contact.email) {
      const result = await notificationService.sendEmail({ to: contact.email, subject, body });
      await supabase.from('notifications').insert({
        event_id: event.id,
        contact_id: contact.id,
        channel: 'EMAIL',
        to_address: contact.email,
        status: result.status,
        provider_message_id: result.provider_message_id,
        error: result.error
      });
    }

    if (follower.notify_sms && contact.phone_e164) {
      const result = await notificationService.sendSMS(contact.phone_e164, body);
      await supabase.from('notifications').insert({
        event_id: event.id,
        contact_id: contact.id,
        channel: 'SMS',
        to_address: contact.phone_e164,
        status: result.status,
        provider_message_id: result.provider_message_id,
        error: result.error
      });
    }
  }
}

async function processFlight(flight: any) {
  console.log(`Processing flight ${flight.flight_iata} for trip ${flight.trip_id}`);

  const response = await aviationstack.getFlight(flight.flight_iata, flight.flight_date_local);

  if (response.error) {
    console.error(`API Error for ${flight.flight_iata}:`, response.error);
    if (response.error.code === 'usage_limit_reached') {
      await supabase.from('settings').update({ aviationstack_paused: true, pause_reason: 'Usage limit reached' }).eq('id', 1);
      return false; // Stop processing
    }
    
    await supabase.from('flights').update({
      tracking_error_code: response.error.code,
      tracking_error_message: response.error.message,
      next_check_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }).eq('id', flight.id);
    return true;
  }

  const bestMatch = response.data[0]; // Simplified: take the first one
  if (!bestMatch) {
    console.log(`No data found for ${flight.flight_iata} on ${flight.flight_date_local}`);
    await supabase.from('flights').update({
      last_checked_at: new Date().toISOString(),
      next_check_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // Retry in 4h
    }).eq('id', flight.id);
    return true;
  }

  const newState = aviationstack.normalize(bestMatch);
  const newHash = computeHash(newState);

  // Get latest snapshot
  const { data: latestSnapshot } = await supabase
    .from('flight_snapshots')
    .select('hash, payload')
    .eq('flight_id', flight.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const oldState = latestSnapshot ? (latestSnapshot.payload as unknown as FlightState) : null;

  if (!latestSnapshot || latestSnapshot.hash !== newHash) {
    console.log(`Change detected for ${flight.flight_iata}`);
    
    // Save snapshot
    await supabase.from('flight_snapshots').insert({
      flight_id: flight.id,
      hash: newHash,
      payload: newState
    });

    // Detect and emit events
    const events = detectEvents(flight.id, oldState, newState);
    for (const event of events) {
      const { data: insertedEvent, error: eventError } = await supabase
        .from('flight_events')
        .insert({
          flight_id: flight.id,
          event_type: event.type,
          event_key: event.key,
          old_state: event.oldState,
          new_state: event.newState
        })
        .select()
        .single();

      if (!eventError && insertedEvent) {
        console.log(`Emitted event: ${event.type} for ${flight.flight_iata}`);
        await sendNotifications(insertedEvent, flight);
      }
    }

    // Update flight
    await supabase.from('flights').update({
      ...newState,
      last_payload: bestMatch,
      last_checked_at: new Date().toISOString(),
      next_check_at: computeNextCheck(newState).toISOString()
    }).eq('id', flight.id);
  } else {
    console.log(`No change for ${flight.flight_iata}`);
    await supabase.from('flights').update({
      last_checked_at: new Date().toISOString(),
      next_check_at: computeNextCheck(newState).toISOString()
    }).eq('id', flight.id);
  }

  return true;
}

async function run() {
  console.log('Worker cycle started at:', new Date().toISOString());

  // Check if paused
  const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (settings?.aviationstack_paused) {
    console.log('Polling is paused globally.');
    return;
  }

  // Get due flights
  const { data: dueFlights, error } = await supabase
    .from('flights')
    .select('*')
    .eq('is_active', true)
    .is('tracking_paused_reason', null)
    .or(`next_check_at.is.null,next_check_at.lte.${new Date().toISOString()}`)
    .limit(20);

  if (error) {
    console.error('Error fetching due flights:', error);
    return;
  }

  console.log(`Found ${dueFlights?.length || 0} due flights`);

  for (const flight of dueFlights || []) {
    const shouldContinue = await processFlight(flight);
    if (!shouldContinue) break;
  }

  console.log('Worker cycle finished at:', new Date().toISOString());
}

async function start() {
  const isContinuous = process.env.RUN_CONTINUOUS === 'true' || process.env.SERVICE_TYPE === 'combined' || !process.env.SERVICE_TYPE;
  
  if (isContinuous) {
    console.log('Worker running in continuous mode (every 10 minutes)');
    while (true) {
      try {
        await run();
      } catch (err) {
        console.error('Iteration error:', err);
      }
      // Wait 10 minutes
      await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
    }
  } else {
    await run();
    process.exit(0);
  }
}

start().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
