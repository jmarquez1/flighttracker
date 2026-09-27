import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderFlights: {
        include: {
          flight: {
            include: {
              events: { orderBy: { createdAt: 'desc' }, take: 10 },
              notifications: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
          }
        },
        orderBy: { segment: 'asc' }
      }
    }
  });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(order);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
