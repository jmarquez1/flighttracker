import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@flight-tracker/db';
import { detectEvents } from '@flight-tracker/shared';
import crypto from 'crypto';

const prisma = new PrismaClient();

function mapStatus(s: string): string {
  const m: Record<string, string> = {
    'Scheduled': 'SCHEDULED', 'EnRoute': 'ACTIVE', 'Landed': 'LANDED',
    'Cancelled': 'CANCELLED', 'Diverted': 'DIVERTED', 'Unknown': 'UNKNOWN'
  };
  return m[s] || 'UNKNOWN';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // AeroDataBox sends: { flight: { number, status, departure, arrival, ... } }
    const f = body?.flight || body;
    if (!f?.number) return NextResponse.json({ ok: false, error: 'no flight number' }, { status: 400 });

    const flightIata = f.number; // e.g. KL1395
    const flightDate = (f.departure?.scheduledTimeLocal || f.departure?.scheduledTimeUtc || '').slice(0, 10);

    if (!flightDate) return NextResponse.json({ ok: false, error: 'no date' }, { status: 400 });

    const flight = await prisma.flight.findFirst({
      where: { flightIata, flightDate }
    });

    if (!flight) {
      // Not tracked — ignore silently
      return NextResponse.json({ ok: true, ignored: true });
    }

    const newState = {
      flight_status: mapStatus(f.status || 'Unknown'),
      dep_scheduled: f.departure?.scheduledTimeUtc ?? null,
      dep_estimated: f.departure?.estimatedTimeUtc ?? null,
      dep_actual: f.departure?.actualTimeUtc ?? null,
      arr_scheduled: f.arrival?.scheduledTimeUtc ?? null,
      arr_estimated: f.arrival?.estimatedTimeUtc ?? null,
      arr_actual: f.arrival?.actualTimeUtc ?? null,
      terminal_dep: f.departure?.terminal ?? null,
      gate_dep: f.departure?.gate ?? null,
      terminal_arr: f.arrival?.terminal ?? null,
      gate_arr: f.arrival?.gate ?? null,
      delay_dep_min: f.departure?.delayMinutes ?? null,
      delay_arr_min: f.arrival?.delayMinutes ?? null,
    };

    const newHash = crypto.createHash('sha256').update(JSON.stringify(newState)).digest('hex');

    const lastSnapshot = await prisma.flightSnapshot.findFirst({
      where: { flightId: flight.id }, orderBy: { createdAt: 'desc' }
    });

    await prisma.flightSnapshot.create({
      data: { flightId: flight.id, hash: newHash, payload: newState as any }
    });

    if (!lastSnapshot || lastSnapshot.hash !== newHash) {
      const events = detectEvents(flight.id, lastSnapshot?.payload as any ?? null, newState);
      for (const evt of events) {
        await prisma.flightEvent.upsert({
          where: { eventKey: evt.key },
          create: { flightId: flight.id, eventType: evt.type as any, eventKey: evt.key, oldValue: evt.oldValue, newValue: evt.newValue },
          update: {}
        });
      }

      await prisma.flight.update({
        where: { id: flight.id },
        data: {
          status: newState.flight_status as any,
          depScheduled: newState.dep_scheduled ? new Date(newState.dep_scheduled) : undefined,
          depEstimated: newState.dep_estimated ? new Date(newState.dep_estimated) : undefined,
          depActual: newState.dep_actual ? new Date(newState.dep_actual) : undefined,
          arrScheduled: newState.arr_scheduled ? new Date(newState.arr_scheduled) : undefined,
          arrEstimated: newState.arr_estimated ? new Date(newState.arr_estimated) : undefined,
          arrActual: newState.arr_actual ? new Date(newState.arr_actual) : undefined,
          terminalDep: newState.terminal_dep,
          gateDep: newState.gate_dep,
          terminalArr: newState.terminal_arr,
          gateArr: newState.gate_arr,
          delayDepMin: newState.delay_dep_min,
          delayArrMin: newState.delay_arr_min,
          lastPolledAt: new Date(),
        }
      });
    }

    return NextResponse.json({ ok: true, events: 'processed' });
  } catch (err: any) {
    console.error('[webhook] Error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
