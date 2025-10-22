import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './lib/session';

// Protect /admin routes: require a session cookie with role ADMIN
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply to /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Allow the login page itself
  if (pathname === '/admin/login' || pathname === '/admin/login/') return NextResponse.next();

  const cookie = req.cookies.get('escrow_user')?.value;
  if (!cookie) {
    const loginUrl = new URL('/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const secret = process.env.SESSION_SECRET || '';
  const parsed = await verifySession(cookie, secret);
  if (!parsed || parsed.role !== 'ADMIN') {
    const loginUrl = new URL('/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
