import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
const DEFAULT_WORKSPACE = 'travelbiuro';
async function ws() { return prisma.workspace.upsert({ where: { slug: DEFAULT_WORKSPACE }, create: { name: 'Travel Biuro', slug: DEFAULT_WORKSPACE }, update: {} }); }
export async function GET() {
  const w = await ws();
  return NextResponse.json(await prisma.notificationRecipient.findMany({ where: { workspaceId: w.id }, orderBy: { createdAt: 'asc' } }));
}
export async function POST(req: NextRequest) {
  const { email, name, type } = await req.json();
  const w = await ws();
  const r = await prisma.notificationRecipient.create({ data: { workspaceId: w.id, email, name, type: type || 'STAFF' } });
  return NextResponse.json(r, { status: 201 });
}
