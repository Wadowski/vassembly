'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { parseOnboardingCompleted, useUserAuth } from '@vassembly/ui-user-auth';

import { getTokens } from './sessionStorage';
import { isOnboardingAllowedRoute } from './isOnboardingAllowedRoute';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

const isAuthPage = (pathname: string): boolean =>
  AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));

export interface OnboardingGateProps {
  children: ReactNode;
}

export const OnboardingGate = ({ children }: OnboardingGateProps): JSX.Element | null => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, bootstrapLoading, role } = useUserAuth();

  const tokens = getTokens();
  const onboardingCompleted =
    tokens.authToken != null
      ? parseOnboardingCompleted({ authToken: tokens.authToken })
      : true;

  const isAdmin = role === 'admin';
  const isAllowedRoute = isOnboardingAllowedRoute(pathname) || isAuthPage(pathname);
  const shouldBlock =
    isAuthenticated && !bootstrapLoading && !isAdmin && !onboardingCompleted && !isAllowedRoute;

  useEffect(() => {
    if (!shouldBlock || bootstrapLoading) {
      return;
    }

    const returnUrl = encodeURIComponent(pathname);
    router.replace(`/onboarding?returnUrl=${returnUrl}`);
  }, [bootstrapLoading, pathname, router, shouldBlock]);

  if (shouldBlock && !bootstrapLoading) {
    return null;
  }

  return <>{children}</>;
};
