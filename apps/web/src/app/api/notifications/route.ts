import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
const DEFAULT_WORKSPACE = 'travelbiuro';
export async function GET() {
  const ws = await prisma.workspace.upsert({ where: { slug: DEFAULT_WORKSPACE }, create: { name: 'Travel Biuro', slug: DEFAULT_WORKSPACE }, update: {} });
  const notifications = await prisma.notification.findMany({
    where: { flight: { workspaceId: ws.id } },
    orderBy: { createdAt: 'desc' }, take: 100,
    include: { flight: { select: { flightIata: true, id: true } } }
  });
  return NextResponse.json(notifications);
}
