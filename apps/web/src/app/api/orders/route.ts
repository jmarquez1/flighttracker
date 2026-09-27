import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_WORKSPACE = 'travelbiuro';
async function ensureWorkspace() {
  return prisma.workspace.upsert({ where: { slug: DEFAULT_WORKSPACE }, create: { name: 'Travel Biuro', slug: DEFAULT_WORKSPACE }, update: {} });
}

export async function GET() {
  const ws = await ensureWorkspace();
  const orders = await prisma.order.findMany({
    where: { workspaceId: ws.id },
    orderBy: { createdAt: 'desc' },
    include: { orderFlights: { include: { flight: true } } }
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { reference, groupName, customerName, customerEmail, notes } = await req.json();
  if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 });
  const ws = await ensureWorkspace();
  const order = await prisma.order.upsert({
    where: { workspaceId_reference: { workspaceId: ws.id, reference } },
    create: { workspaceId: ws.id, reference, groupName, customerName, customerEmail, notes },
    update: { groupName, customerName, customerEmail, notes }
  });
  return NextResponse.json(order, { status: 201 });
}
