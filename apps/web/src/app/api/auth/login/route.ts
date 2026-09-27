import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { setSession } from '@/lib/auth';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'ft-salt-2026').digest('hex');
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const hash = hashPassword(password);
  if (hash !== user.passwordHash) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  await setSession(user.id, user.email);
  return NextResponse.json({ ok: true });
}
