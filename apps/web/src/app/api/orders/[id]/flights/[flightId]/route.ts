import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; flightId: string }> }) {
  const { id: orderId, flightId } = await params;
  await prisma.orderFlight.deleteMany({ where: { orderId, flightId } });
  return NextResponse.json({ ok: true });
}
