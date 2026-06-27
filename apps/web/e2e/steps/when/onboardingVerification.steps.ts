import { createBdd } from 'playwright-bdd';

import { bddTest, getE2eEnvironment } from '@vassembly/e2e';

import { issueVerificationTokenForUser } from '../utils/onboardingUserState';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

const openVerificationLink = async ({
  page,
  token,
}: {
  page: NonNullable<import('@playwright/test').Page>;
  token: string;
}): Promise<void> => {
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`, {
    waitUntil: 'domcontentloaded',
  });
};

When('I open the email verification link with a valid unexpired token', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const token = webWorld.verificationToken;
  if (!token) {
    throw new Error('Verification token must be issued before opening the link');
  }

  await openVerificationLink({ page, token });
});

When('the token has passed its expiry time', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be authenticated before expiring verification token');
  }

  const { plaintextToken } = await issueVerificationTokenForUser({
    context: seed,
    userId: webWorld.auth.userId,
    expiresAt: new Date(Date.now() - 60_000),
  });

  webWorld.verificationToken = plaintextToken;
});

When('I open the expired email verification link', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const token = webWorld.verificationToken;
  if (!token) {
    throw new Error('Expired verification token must be set before opening the link');
  }

  await openVerificationLink({ page, token });
});

When('the user or another session uses the same token again', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const token = webWorld.verificationToken;
  if (!token) {
    throw new Error('Verification token must be set before reuse attempt');
  }

  await openVerificationLink({ page, token });
});

When('I activate "Resend email" on the onboarding hub', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.getByRole('button', { name: /resend email/i }).click();
});

When('the user submits an action that would complete a step', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.getByRole('button', { name: /resend email/i }).click();
});

When('a malformed or unknown token is submitted', async ({ world }) => {
  const webWorld = world as WebBddWorld;
  webWorld.verificationToken = 'invalid-unknown-token';
});

When('I open the email verification link with the invalid token', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const token = webWorld.verificationToken ?? 'invalid-unknown-token';
  await openVerificationLink({ page, token });
});

When('the user clicks a valid verification link', async ({ page, seed, world }) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be authenticated before opening verification link');
  }

  const { plaintextToken } = await issueVerificationTokenForUser({
    context: seed,
    userId: webWorld.auth.userId,
  });

  webWorld.verificationToken = plaintextToken;
  await openVerificationLink({ page, plaintextToken });
});

When('the resend verification endpoint is called', async ({ api, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.token) {
    throw new Error('User must be authenticated before calling resend verification');
  }

  const apiBaseUrl = getE2eEnvironment().apiBaseUrl;
  const response = await api.fetch(`${apiBaseUrl}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${webWorld.auth.token}`,
      'Content-Type': 'application/json',
    },
    data: {},
  });

  webWorld.lastResponse = response;
});
