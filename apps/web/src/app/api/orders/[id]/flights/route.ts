import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const { flightId, segment } = await req.json();
  if (!flightId) return NextResponse.json({ error: 'flightId required' }, { status: 400 });
  const link = await prisma.orderFlight.upsert({
    where: { orderId_flightId: { orderId, flightId } },
    create: { orderId, flightId, segment: segment || 1 },
    update: {}
  });
  return NextResponse.json(link, { status: 201 });
}
