import type { RouteDefinition } from '@vassembly/server';

import { authRoute } from './auth';
import { completeOnboardingRoute } from './completeOnboarding';
import { logoutRoute } from './logout';
import { refreshRoute } from './refresh';
import { resendVerificationRoute } from './resendVerification';
import { verifyEmailRoute } from './verifyEmail';

export const routes: RouteDefinition[] = [
  authRoute,
  refreshRoute,
  logoutRoute,
  verifyEmailRoute,
  resendVerificationRoute,
  completeOnboardingRoute,
];
