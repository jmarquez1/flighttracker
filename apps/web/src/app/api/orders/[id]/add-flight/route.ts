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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const { flightIata, flightDate } = await req.json();
  if (!flightIata || !flightDate) return NextResponse.json({ error: 'flightIata and flightDate required' }, { status: 400 });

  const ws = await ensureWorkspace();

  // Check if flight already exists
  const existing = await prisma.flight.findUnique({
    where: { workspaceId_flightIata_flightDate: { workspaceId: ws.id, flightIata: flightIata.toUpperCase(), flightDate } }
  });

  let flight = existing;
  const alreadyExisted = !!existing;

  if (!flight) {
    let preview = null;
    try { preview = await previewFlight(flightIata.toUpperCase(), flightDate); } catch {}
    flight = await prisma.flight.create({
      data: {
        workspaceId: ws.id,
        flightIata: flightIata.toUpperCase(),
        flightDate,
        airline: preview?.airline,
        origin: preview?.origin,
        destination: preview?.destination,
        originCity: preview?.originCity,
        destinationCity: preview?.destinationCity,
        status: (preview?.status as any) || 'SCHEDULED',
        depScheduled: preview?.depScheduled ? new Date(preview.depScheduled) : null,
        arrScheduled: preview?.arrScheduled ? new Date(preview.arrScheduled) : null,
        gateDep: preview?.gateDep,
        terminalDep: preview?.terminalDep,
        delayDepMin: preview?.delayDepMin,
        nextPollAt: new Date(),
      }
    });
  }

  // Link to order (upsert to avoid duplicate)
  const alreadyLinked = await prisma.orderFlight.findUnique({
    where: { orderId_flightId: { orderId, flightId: flight.id } }
  });

  if (!alreadyLinked) {
    await prisma.orderFlight.create({ data: { orderId, flightId: flight.id, segment: 1 } });
  }

  return NextResponse.json({ flight, alreadyExisted, alreadyLinked: !!alreadyLinked }, { status: 201 });
}
