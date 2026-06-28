import { randomUUID } from 'node:crypto';

import { seedUser } from '@vassembly/e2e';
import type { Page } from '@playwright/test';
import type { SeedContext } from '@vassembly/e2e';

import { E2E_USER_PASSWORD, getSessionAuthToken, signInSeededUser } from './auth';
import { type OnboardingUserState, updateUserOnboardingState } from './onboardingUserState';

export interface SeedOnboardingUserParams {
  context: SeedContext;
  page: Page;
  state: OnboardingUserState;
  email?: string;
}

export interface SeedOnboardingUserResult {
  userId: string;
  email: string;
  token: string;
}

export const seedAndSignInOnboardingUser = async ({
  context,
  page,
  state,
  email,
}: SeedOnboardingUserParams): Promise<SeedOnboardingUserResult> => {
  const userEmail = email ?? `e2e-onboarding-${randomUUID()}@vassembly.test`;
  const user = await seedUser({
    email: userEmail,
    password: E2E_USER_PASSWORD,
    context,
  });

  await updateUserOnboardingState({
    context,
    userId: user.id,
    state,
  });
  await signInSeededUser({ page, email: user.email });
  const sessionToken = await getSessionAuthToken({ page });

  return { userId: user.id, email: user.email, token: sessionToken };
};
