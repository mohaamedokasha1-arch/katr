import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === '/admin/login') return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Admin session required.' },
        { status: 401 },
      );
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
