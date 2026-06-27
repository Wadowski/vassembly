import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { updateUserOnboardingState } from '../utils/onboardingUserState';
import { seedAndSignInOnboardingUser } from '../utils/seedOnboardingUser';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const INCOMPLETE_ONBOARDING_STATE = {
  completedAt: null as Date | null,
  verifiedAt: null as Date | null,
};

Given('an authenticated user with incomplete onboarding', async ({ page, seed, world }) => {
  if (!page) {
    return;
  }

  const user = await seedAndSignInOnboardingUser({
    context: seed,
    page,
    state: INCOMPLETE_ONBOARDING_STATE,
  });

  world.auth = { userId: user.userId, token: user.token, email: user.email };
});

Given(
  'an authenticated user with verified email and incomplete onboarding',
  async ({ page, seed, world }) => {
    if (!page) {
      return;
    }

    const user = await seedAndSignInOnboardingUser({
      context: seed,
      page,
      state: { completedAt: null, verifiedAt: new Date() },
    });

    world.auth = { userId: user.userId, token: user.token, email: user.email };
  },
);

Given(
  'an authenticated user with incomplete onboarding and no active AI credentials',
  async ({ page, seed, world }) => {
    if (!page) {
      return;
    }

    const user = await seedAndSignInOnboardingUser({
      context: seed,
      page,
      state: { completedAt: null, verifiedAt: new Date() },
    });

    world.auth = { userId: user.userId, token: user.token, email: user.email };
  },
);

Given('an authenticated user with completed onboarding', async ({ page, seed, world }) => {
  if (!page) {
    return;
  }

  const user = await seedAndSignInOnboardingUser({
    context: seed,
    page,
    state: { completedAt: new Date(), verifiedAt: new Date() },
  });

  world.auth = { userId: user.userId, token: user.token, email: user.email };
});

Given(
  'a user who registered before the onboarding feature was deployed',
  async ({ page, seed, world }) => {
    if (!page) {
      return;
    }

    const user = await seedAndSignInOnboardingUser({
      context: seed,
      page,
      state: { isGrandfathered: true, verifiedAt: new Date() },
    });

    world.auth = { userId: user.userId, token: user.token, email: user.email };
  },
);

Given('the user is on the onboarding hub', async ({ page, seed, world }) => {
  if (!page) {
    return;
  }

  const user = await seedAndSignInOnboardingUser({
    context: seed,
    page,
    state: INCOMPLETE_ONBOARDING_STATE,
  });

  world.auth = { userId: user.userId, token: user.token, email: user.email };
  await page.goto('/onboarding');
});

Given('onboarding.completedAt is null', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be authenticated before setting onboarding state');
  }

  await updateUserOnboardingState({
    context: seed,
    userId: webWorld.auth.userId,
    state: { completedAt: null, verifiedAt: null },
  });
});

Given('verifiedAt is already set on the user record', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be authenticated before setting verifiedAt');
  }

  await updateUserOnboardingState({
    context: seed,
    userId: webWorld.auth.userId,
    state: { completedAt: null, verifiedAt: new Date() },
  });
});
