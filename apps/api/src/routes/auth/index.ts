import type { RouteDefinition } from '@vassembly/server';

import { authRoute } from './auth';
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
];
