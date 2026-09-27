// Simple cookie-based auth using Node's built-in crypto (no extra packages)
import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.AUTH_SECRET || 'ft-secret-change-in-prod-2026';
const COOKIE = 'ft_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(payload: string): string {
  const mac = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

function verify(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  return payload;
}

export async function setSession(userId: string, email: string) {
  const payload = Buffer.from(JSON.stringify({ id: userId, email, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  const token = sign(payload);
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: MAX_AGE, path: '/' });
}

export async function getSession(): Promise<{ id: string; email: string } | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const payload = verify(raw);
  if (!payload) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    return { id: data.id, email: data.email };
  } catch { return null; }
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
