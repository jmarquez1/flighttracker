import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = await prisma.flight.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: 'desc' }, take: 50 },
      orderFlights: { include: { order: true } },
      notifications: { orderBy: { createdAt: 'desc' }, take: 20 },
      _count: { select: { events: true } }
    }
  });
  if (!flight) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(flight);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const allowed = ['holdCustomerNotifications', 'holdReason', 'pollingPaused'];
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  const flight = await prisma.flight.update({ where: { id }, data });
  return NextResponse.json(flight);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.flight.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
