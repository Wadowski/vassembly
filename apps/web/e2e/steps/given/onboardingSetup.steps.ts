import { randomUUID } from 'node:crypto';

import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { E2E_USER_PASSWORD } from '../utils/auth';
import {
  issueVerificationTokenForUser,
  updateUserOnboardingState,
} from '../utils/onboardingUserState';
import { seedAndSignInOnboardingUser } from '../utils/seedOnboardingUser';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const INCOMPLETE_ONBOARDING_STATE = {
  completedAt: null as Date | null,
  verifiedAt: null as Date | null,
};

Given('the user has received a verification email', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be authenticated before issuing a verification email');
  }

  const { plaintextToken } = await issueVerificationTokenForUser({
    context: seed,
    userId: webWorld.auth.userId,
  });

  webWorld.verificationToken = plaintextToken;
});

Given('the resend cooldown has elapsed', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be authenticated before adjusting resend cooldown');
  }

  await updateUserOnboardingState({
    context: seed,
    userId: webWorld.auth.userId,
    state: {
      completedAt: null,
      verifiedAt: null,
      emailVerificationIssuedAt: new Date(Date.now() - 120_000),
    },
  });
});

Given(
  'the user requested a verification email less than the cooldown period ago',
  async ({ seed, world }) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be authenticated before adjusting resend cooldown');
    }

    await updateUserOnboardingState({
      context: seed,
      userId: webWorld.auth.userId,
      state: {
        completedAt: null,
        verifiedAt: null,
        emailVerificationIssuedAt: new Date(),
      },
    });
  },
);

Given(
  'a new user registered after attempting to reach a protected route',
  async ({ page, seed, world }) => {
    if (!page) {
      return;
    }

    const webWorld = world as WebBddWorld;
    webWorld.capturedReturnUrl = '/agents';

    const user = await seedAndSignInOnboardingUser({
      context: seed,
      page,
      state: INCOMPLETE_ONBOARDING_STATE,
    });

    world.auth = { userId: user.userId, token: user.token, email: user.email };
  },
);

Given('a returnUrl was captured that is not on the safe allowlist', async ({ world }) => {
  const webWorld = world as WebBddWorld;
  webWorld.capturedReturnUrl = 'https://evil.example.com/phish';
});

Given('a user registered and received a verification email', async ({ page, seed, world }) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const user = await seedAndSignInOnboardingUser({
    context: seed,
    page,
    state: INCOMPLETE_ONBOARDING_STATE,
  });

  const { plaintextToken } = await issueVerificationTokenForUser({
    context: seed,
    userId: user.userId,
  });

  world.auth = { userId: user.userId, token: user.token, email: user.email };
  webWorld.verificationToken = plaintextToken;
});

Given('the returnUrl was captured before the redirect to {string}', async ({ world }) => {
  const webWorld = world as WebBddWorld;
  webWorld.capturedReturnUrl = '/agents';
});

Given('a visitor completes registration', async ({ world }) => {
  const email = `e2e-onboarding-register-${randomUUID()}@vassembly.test`;
  world.storedFields = { ...world.storedFields, registrationEmail: email };
});

Given('the account is created', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const email = world.storedFields?.registrationEmail;
  if (!email) {
    throw new Error('Registration email must be set before creating the account');
  }

  await page.goto('/register');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('First Name', { exact: true }).fill('Test');
  await page.getByLabel('Last Name', { exact: true }).fill('User');
  await page.getByRole('checkbox', { name: /privacy policy/i }).check();
  await page.getByRole('checkbox', { name: /terms and conditions/i }).check();
  await page.getByLabel('Password', { exact: true }).fill(E2E_USER_PASSWORD);
  await page.getByLabel('Confirm Password', { exact: true }).fill(E2E_USER_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
});
