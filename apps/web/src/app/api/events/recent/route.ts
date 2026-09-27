import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_WORKSPACE = 'travelbiuro';

export async function GET() {
  const ws = await prisma.workspace.findUnique({ where: { slug: DEFAULT_WORKSPACE } });
  if (!ws) return NextResponse.json([]);

  const events = await prisma.flightEvent.findMany({
    where: { flight: { workspaceId: ws.id } },
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: {
      flight: {
        select: { flightIata: true, origin: true, destination: true, id: true }
      }
    }
  });

  return NextResponse.json(events);
}
