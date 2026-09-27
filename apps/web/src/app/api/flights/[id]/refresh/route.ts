import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { previewFlight } from '@/lib/aerodata';
import { detectEvents } from '@flight-tracker/shared';
import crypto from 'crypto';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = await prisma.flight.findUnique({ where: { id } });
  if (!flight) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const data = await previewFlight(flight.flightIata, flight.flightDate);
  if (!data) return NextResponse.json({ error: 'api returned nothing' }, { status: 502 });

  const newState = { flight_status: data.status, dep_scheduled: data.depScheduled, dep_estimated: null, dep_actual: null, arr_scheduled: data.arrScheduled, arr_estimated: null, arr_actual: null, terminal_dep: data.terminalDep, gate_dep: data.gateDep, terminal_arr: null, gate_arr: null, delay_dep_min: data.delayDepMin, delay_arr_min: null };
  const newHash = crypto.createHash('sha256').update(JSON.stringify(newState)).digest('hex');
  const last = await prisma.flightSnapshot.findFirst({ where: { flightId: id }, orderBy: { createdAt: 'desc' } });

  await prisma.flightSnapshot.create({ data: { flightId: id, hash: newHash, payload: newState as any } });

  let newEvents = 0;
  if (!last || last.hash !== newHash) {
    const events = detectEvents(id, last?.payload as any ?? null, newState);
    for (const evt of events) {
      await prisma.flightEvent.upsert({
        where: { eventKey: evt.key },
        create: { flightId: id, eventType: evt.type as any, eventKey: evt.key, oldValue: evt.oldValue, newValue: evt.newValue },
        update: {}
      });
      newEvents++;
    }
    await prisma.flight.update({ where: { id }, data: { status: data.status as any, depScheduled: data.depScheduled ? new Date(data.depScheduled) : undefined, arrScheduled: data.arrScheduled ? new Date(data.arrScheduled) : undefined, gateDep: data.gateDep, terminalDep: data.terminalDep, delayDepMin: data.delayDepMin, lastPolledAt: new Date(), nextPollAt: new Date(Date.now() + 10 * 60 * 1000) } });
  }

  return NextResponse.json({ ok: true, newEvents, status: data.status });
}
