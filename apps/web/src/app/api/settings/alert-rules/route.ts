import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
const DEFAULT_WORKSPACE = 'travelbiuro';
async function ws() { return prisma.workspace.upsert({ where: { slug: DEFAULT_WORKSPACE }, create: { name: 'Travel Biuro', slug: DEFAULT_WORKSPACE }, update: {} }); }
export async function GET() {
  const w = await ws();
  return NextResponse.json(await prisma.alertRule.findMany({ where: { workspaceId: w.id } }));
}
export async function POST(req: NextRequest) {
  const { eventType, staffEnabled, customerEnabled, customerTiming } = await req.json();
  const w = await ws();
  const rule = await prisma.alertRule.upsert({
    where: { workspaceId_eventType: { workspaceId: w.id, eventType } },
    create: { workspaceId: w.id, eventType, staffEnabled, customerEnabled, customerTiming: customerTiming || 'MANUAL' },
    update: { staffEnabled, customerEnabled, customerTiming: customerTiming || 'MANUAL' }
  });
  return NextResponse.json(rule);
}
