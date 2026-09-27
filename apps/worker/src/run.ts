import 'dotenv/config';
import crypto from 'crypto';
import { PrismaClient } from '@flight-tracker/db';
import { detectEvents, getNextPollMs } from '@flight-tracker/shared';
import { fetchFlight } from './lib/aerodata';
import { sendAlert, buildFallbackHtml } from './lib/brevo';

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 60 * 1000;

function hash(obj: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function formatDt(dt: Date | string | null | undefined): string {
  if (!dt) return '—';
  const d = dt instanceof Date ? dt : new Date(dt);
  return d.toUTCString().replace(/:\d\d GMT$/, ' UTC').replace(/\s+/, ' ');
}

function formatVal(val: any): string {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return `${val} min`;
  return JSON.stringify(val);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processFlight(flight: any) {
  if (flight.pollingPaused || flight.status === 'LANDED' || flight.status === 'CANCELLED') return;

  const now = new Date();
  if (flight.nextPollAt && flight.nextPollAt > now) return;
  if (flight.pollingLocked) return;

  await prisma.flight.update({ where: { id: flight.id }, data: { pollingLocked: true } });

  try {
    const liveData = await fetchFlight(flight.flightIata, flight.flightDate);
    if (!liveData) {
      console.log(`[worker] No data for ${flight.flightIata} ${flight.flightDate}`);
      const nextMs = getNextPollMs(flight.depScheduled ? new Date(flight.depScheduled) : null, now);
      const nextPollAt = nextMs === 0 ? null : new Date(now.getTime() + nextMs);
      await prisma.flight.update({
        where: { id: flight.id },
        data: { lastPolledAt: now, nextPollAt, pollingLocked: false }
      });
      return;
    }

    const oldHash = flight.dataHash;
    const newHashData = {
      status: liveData.flight_status,
      dep_estimated: liveData.dep_estimated,
      dep_actual: liveData.dep_actual,
      arr_actual: liveData.arr_actual,
      terminal_dep: liveData.terminal_dep,
      gate_dep: liveData.gate_dep,
      terminal_arr: liveData.terminal_arr,
      gate_arr: liveData.gate_arr,
      delay_dep_min: liveData.delay_dep_min,
    };
    const newHash = hash(newHashData);

    if (oldHash !== newHash) {
      const oldState = flight.lastState ? JSON.parse(flight.lastState) : null;
      const events = detectEvents(flight.id, oldState, liveData);

      console.log(`[worker] ${flight.flightIata}: ${events.length} event(s) (status=${liveData.flight_status})`);
      for (const evt of events) {
        const created = await prisma.flightEvent.upsert({
          where: { eventKey: evt.key },
          create: { flightId: flight.id, eventType: evt.type as any, eventKey: evt.key, oldValue: evt.oldValue, newValue: evt.newValue },
          update: {}
        });
        await fireNotifications(flight, created, evt.type);
      }

      await prisma.flight.update({
        where: { id: flight.id },
        data: {
          status: liveData.flight_status as any,
          depScheduled: liveData.dep_scheduled ? new Date(liveData.dep_scheduled) : undefined,
          depEstimated: liveData.dep_estimated ? new Date(liveData.dep_estimated) : undefined,
          depActual: liveData.dep_actual ? new Date(liveData.dep_actual) : undefined,
          arrScheduled: liveData.arr_scheduled ? new Date(liveData.arr_scheduled) : undefined,
          arrEstimated: liveData.arr_estimated ? new Date(liveData.arr_estimated) : undefined,
          arrActual: liveData.arr_actual ? new Date(liveData.arr_actual) : undefined,
          terminalDep: liveData.terminal_dep,
          gateDep: liveData.gate_dep,
          terminalArr: liveData.terminal_arr,
          gateArr: liveData.gate_arr,
          delayDepMin: liveData.delay_dep_min,
          delayArrMin: liveData.delay_arr_min,
          dataHash: newHash,
          lastState: JSON.stringify(liveData),
        }
      });
    } else {
      console.log(`[worker] ${flight.flightIata}: no change (hash match)`);
    }

    const nextMs = getNextPollMs(flight.depScheduled ? new Date(flight.depScheduled) : null, now);
    const nextPollAt = nextMs === 0 ? null : new Date(now.getTime() + nextMs);
    await prisma.flight.update({
      where: { id: flight.id },
      data: { lastPolledAt: now, nextPollAt, pollingLocked: false, pollingPaused: nextMs === 0 }
    });

  } catch (err: any) {
    console.error(`[worker] Error polling ${flight.flightIata}:`, err.message);
    await prisma.flight.update({ where: { id: flight.id }, data: { pollingLocked: false } });
  }
}

async function fireNotifications(flight: any, event: any, eventType: string) {
  const rule = await prisma.alertRule.findUnique({
    where: { workspaceId_eventType: { workspaceId: flight.workspaceId, eventType: eventType as any } }
  });

  const staffEnabled = rule ? rule.staffEnabled : true;
  const customerEnabled = rule ? rule.customerEnabled : false;

  const orderFlights = await prisma.orderFlight.findMany({
    where: { flightId: flight.id },
    include: { order: true }
  });
  const orderRef = orderFlights.length > 0
    ? orderFlights.map((of: any) => of.order.reference).join(', ')
    : '—';

  if (staffEnabled) {
    const recipients = await prisma.notificationRecipient.findMany({
      where: { workspaceId: flight.workspaceId, type: { in: ['STAFF', 'OPS'] }, isActive: true }
    });
    for (const r of recipients) {
      await sendAndLog(flight, event, r.email, r.name, eventType, orderRef);
    }
  }

  if (customerEnabled && !flight.holdCustomerNotifications) {
    const recipients = await prisma.notificationRecipient.findMany({
      where: { workspaceId: flight.workspaceId, type: 'CUSTOMER', isActive: true }
    });
    for (const r of recipients) {
      await sendAndLog(flight, event, r.email, r.name, eventType, orderRef);
    }
  }
}

async function sendAndLog(flight: any, event: any, email: string, name: string | null, eventType: string, orderRef: string) {
  const params = {
    flightIata:   flight.flightIata,
    airline:      flight.airline || '—',
    origin:       flight.origin || '—',
    destination:  flight.destination || '—',
    originCity:   flight.originCity || '',
    destCity:     flight.destinationCity || '',
    depScheduled: formatDt(flight.depScheduled),
    arrScheduled: formatDt(flight.arrScheduled),
    depEstimated: formatDt(flight.depEstimated),
    delayDepMin:  flight.delayDepMin || 0,
    gateDep:      flight.gateDep || '',
    terminalDep:  flight.terminalDep || '',
    gateArr:      flight.gateArr || '',
    terminalArr:  flight.terminalArr || '',
    oldValue:     formatVal(event.oldValue),
    newValue:     formatVal(event.newValue),
    orderRef,
    dashboardUrl: 'https://flights.travelbiuro.com/dashboard/flights/' + flight.id,
  };

  const EVENT_SUBJECTS: Record<string, string> = {
    CANCELLED:       `CANCELLED: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    DIVERTED:        `DIVERTED: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    DELAY_30:        `DELAY ${formatVal(event.newValue)}: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    DELAY_60:        `DELAY ${formatVal(event.newValue)}: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    DELAY_120:       `DELAY ${formatVal(event.newValue)}: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    GATE_ASSIGNED:   `GATE ASSIGNED ${formatVal(event.newValue)}: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    GATE_CHANGE:     `GATE CHANGE → ${formatVal(event.newValue)}: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    TERMINAL_CHANGE: `TERMINAL CHANGE → ${formatVal(event.newValue)}: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    SCHEDULE_CHANGE: `RESCHEDULED → ${formatVal(event.newValue)}: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    DEPARTED:        `DEPARTED ${formatVal(event.newValue)}: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    ARRIVED:         `ARRIVED ${formatVal(event.newValue)}: ${flight.flightIata} (${flight.origin}→${flight.destination})`,
    BOARDING:        `BOARDING: ${flight.flightIata} — Gate ${flight.gateDep || '?'} (${flight.origin}→${flight.destination})`,
    STATUS_CHANGE:   `${flight.flightIata} is now ${formatVal(event.newValue)} (${flight.origin}→${flight.destination})`,
  };
  const fallbackSubject = EVENT_SUBJECTS[eventType] || `[${flight.flightIata}] ${eventType.replace(/_/g, ' ')}`;
  const fallbackHtml = buildFallbackHtml(flight.flightIata, eventType, event.oldValue, event.newValue, params);

  try {
    await sendAlert({ to: [{ email, name: name ?? undefined }], eventType, params, fallbackSubject, fallbackHtml });
    await prisma.notification.create({
      data: {
        flightId: flight.id, eventId: event.id, recipientEmail: email, recipientName: name,
        subject: fallbackSubject, body: fallbackHtml, status: 'SENT', sentAt: new Date(), provider: 'brevo'
      }
    });
    console.log(`[worker] Email SENT to ${email} for ${eventType}`);
  } catch (err: any) {
    await prisma.notification.create({
      data: {
        flightId: flight.id, eventId: event.id, recipientEmail: email, recipientName: name,
        subject: fallbackSubject, body: fallbackHtml, status: 'FAILED', error: err.message, provider: 'brevo'
      }
    });
    console.error(`[worker] Email FAILED to ${email}:`, err.message);
  }
}

async function mainLoop() {
  console.log('[worker] Starting poll cycle...');

  // Auto-release locks stuck for more than 5 minutes (crash recovery)
  const released = await prisma.flight.updateMany({
    where: { pollingLocked: true, updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
    data: { pollingLocked: false }
  });
  if (released.count > 0) console.log(`[worker] Released ${released.count} stale lock(s)`);

  const flights = await prisma.flight.findMany({
    where: { pollingPaused: false, status: { notIn: ['LANDED', 'CANCELLED'] } }
  });
  console.log(`[worker] ${flights.length} active flights to check`);

  // Sequential with 1.5s gap to avoid AeroDataBox rate limits
  for (const flight of flights) {
    await processFlight(flight);
    await sleep(1500);
  }
}

async function start() {
  console.log('[worker] Flight Tracker Worker started');
  await mainLoop();
  setInterval(mainLoop, POLL_INTERVAL_MS);
}

start().catch(console.error);
