import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.AUTH_SECRET || 'ft-secret-change-in-prod-2026';
const COOKIE = 'ft_session';

async function verifySession(token: string): Promise<boolean> {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const macBytes = Uint8Array.from(atob(mac.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, macBytes, enc.encode(payload));
    if (!valid) return false;
    const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return data.exp > Date.now();
  } catch { return false; }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public: login, auth APIs, webhooks, token routes, static
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhook') ||
    pathname.startsWith('/t/') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  if (!token || !(await verifySession(token))) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
