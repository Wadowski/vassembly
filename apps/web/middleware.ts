import { NextRequest, NextResponse } from 'next/server';
import { ONBOARDING_ALLOWED_ROUTES } from '@vassembly/constants';
import { decodeJwtPayload } from '@vassembly/ui-user-auth/decodeJwtPayload';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];
const AUTH_TOKEN_KEY = 'auth-token';

const ONBOARDING_ROUTE = '/onboarding';
const ONBOARDING_ALLOWED_ROUTE_SET = new Set<string>(ONBOARDING_ALLOWED_ROUTES);

const isValidAuthToken = (token: string): boolean => {
  const claims = decodeJwtPayload(token);
  if (claims === null) {
    return false;
  }

  const exp = claims.exp;
  if (typeof exp === 'number') {
    return exp * 1000 > Date.now();
  }

  return true;
};

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const authToken = request.cookies.get(AUTH_TOKEN_KEY)?.value;
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (isAuthPage && authToken) {
    if (isValidAuthToken(authToken)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const response = NextResponse.next();
    response.cookies.delete(AUTH_TOKEN_KEY);
    return response;
  }

  if (authToken) {
    const claims = decodeJwtPayload(authToken);
    const isOnAllowedRoute = ONBOARDING_ALLOWED_ROUTE_SET.has(pathname);

    if (claims === null) {
      if (!isOnAllowedRoute) {
        const returnUrl = encodeURIComponent(pathname);
        return NextResponse.redirect(
          new URL(`${ONBOARDING_ROUTE}?returnUrl=${returnUrl}`, request.url),
        );
      }
      return NextResponse.next();
    }

    const isAdmin = claims.role === 'admin';
    const onboardingCompleted = claims.onb !== false;

    if (!isAdmin && !onboardingCompleted && !isOnAllowedRoute) {
      const returnUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`${ONBOARDING_ROUTE}?returnUrl=${returnUrl}`, request.url),
      );
    }

    if (onboardingCompleted && pathname.startsWith(ONBOARDING_ROUTE)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login/:path*',
    '/register/:path*',
    '/forgot-password/:path*',
    '/reset-password/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
