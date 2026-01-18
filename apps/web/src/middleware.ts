import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    // Intentamos actualizar la sesión de Supabase
    return await updateSession(request)
  } catch (error) {
    // Si falla el middleware de Supabase, no bloqueamos la app con un 500
    // Simplemente dejamos pasar la petición para que la app maneje el estado
    console.error('Middleware execution error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
