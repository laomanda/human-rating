import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Placeholder proxy for Phase 1 (menggantikan middleware.ts sesuai konvensi terbaru Next.js)
// Di Phase 2 (Authentication), kita akan menambahkan logika Supabase Auth di sini.
export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
