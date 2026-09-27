import { NextRequest, NextResponse } from 'next/server';
import { previewFlight } from '@/lib/aerodata';

export async function GET(req: NextRequest) {
  const iata = req.nextUrl.searchParams.get('iata');
  const date = req.nextUrl.searchParams.get('date');
  if (!iata || !date) return NextResponse.json({ error: 'missing params' }, { status: 400 });
  const data = await previewFlight(iata.toUpperCase(), date);
  if (!data) return NextResponse.json({ error: 'flight not found' }, { status: 404 });
  return NextResponse.json(data);
}
