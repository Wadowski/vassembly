import { NextRequest, NextResponse } from 'next/server';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];
const AUTH_TOKEN_KEY = 'auth-token';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authToken = request.cookies.get(AUTH_TOKEN_KEY)?.value;
  const isAuthPage = AUTH_PAGES.some(page => pathname.startsWith(page));

  if (isAuthPage && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/login/:path*',
    '/register/:path*',
    '/forgot-password/:path*',
    '/reset-password/:path*',
  ],
};
