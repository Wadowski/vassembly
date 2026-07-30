import { ONBOARDING_ALLOWED_ROUTES } from '@vassembly/constants';

export const isOnboardingAllowedRoute = (pathname: string): boolean =>
  ONBOARDING_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
