import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { previewFlight } from '@/lib/aerodata';

const DEFAULT_WORKSPACE = 'travelbiuro';

async function ensureWorkspace() {
  return prisma.workspace.upsert({
    where: { slug: DEFAULT_WORKSPACE },
    create: { name: 'Travel Biuro', slug: DEFAULT_WORKSPACE },
    update: {}
  });
}

export async function GET() {
  const ws = await ensureWorkspace();
  const flights = await prisma.flight.findMany({
    where: { workspaceId: ws.id },
    orderBy: { depScheduled: 'asc' },
    include: { orderFlights: { include: { order: true } }, _count: { select: { events: true } } }
  });
  return NextResponse.json(flights);
}

export async function POST(req: NextRequest) {
  const { flightIata, flightDate } = await req.json();
  if (!flightIata || !flightDate) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  // Basic format validation
  const iata = flightIata.toUpperCase().trim();
  if (!/^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(iata))
    return NextResponse.json({ error: 'Invalid flight number format' }, { status: 400 });

  const ws = await ensureWorkspace();

  // Check if already tracked (return existing without hitting API again)
  const existing = await prisma.flight.findUnique({
    where: { workspaceId_flightIata_flightDate: { workspaceId: ws.id, flightIata: iata, flightDate } }
  });
  if (existing) return NextResponse.json(existing, { status: 201 });

  // Must resolve from AeroDataBox before creating
  let preview = null;
  try { preview = await previewFlight(iata, flightDate); } catch {}

  if (!preview) {
    return NextResponse.json({ error: 'Flight not found in AeroDataBox for that date. Check the flight number and date.' }, { status: 404 });
  }

  const flight = await prisma.flight.create({
    data: {
      workspaceId: ws.id,
      flightIata: iata,
      flightDate,
      airline: preview.airline,
      origin: preview.origin,
      destination: preview.destination,
      originCity: preview.originCity,
      destinationCity: preview.destinationCity,
      status: (preview.status as any) || 'SCHEDULED',
      depScheduled: preview.depScheduled ? new Date(preview.depScheduled) : null,
      arrScheduled: preview.arrScheduled ? new Date(preview.arrScheduled) : null,
      gateDep: preview.gateDep,
      terminalDep: preview.terminalDep,
      delayDepMin: preview.delayDepMin,
      nextPollAt: new Date(),
    }
  });

  return NextResponse.json(flight, { status: 201 });
}
