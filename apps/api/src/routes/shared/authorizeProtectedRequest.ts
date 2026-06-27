import { handlers as authHandlers } from '@vassembly/service-auth';

import { enforceOnboardingComplete } from './enforceOnboardingComplete';

export interface AuthorizeProtectedRequestParams {
  headers: Record<string, string>;
}

export const authorizeProtectedRequest = async ({
  headers,
}: AuthorizeProtectedRequestParams) => {
  const authResult = await authHandlers.authorizeRequest({ headers });
  enforceOnboardingComplete({
    onboardingCompleted: authResult.onboardingCompleted,
    role: authResult.role,
  });
  return authResult;
};
