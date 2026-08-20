import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname } = request.nextUrl;

  // If request comes from client custom domain (e.g. citas.pakogarcia.es or masajes.pakogarcia.es) at root "/"
  if ((host.includes('citas') || host.includes('masajes')) && pathname === '/') {
    return NextResponse.rewrite(new URL('/reservas', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
