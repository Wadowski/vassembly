import { createBdd } from 'playwright-bdd';

import { expect } from '@playwright/test';

import { bddTest } from '@vassembly/e2e';

import type { WebBddWorld } from '../utils/types';

const { Then } = createBdd(bddTest);

const ONBOARDING_HEADING = 'Complete your account setup';
const STEP1_TITLE = 'Verify email address';
const STEP2_TITLE = 'Create first AI integration';

const getOnboardingHub = ({ page }: { page: NonNullable<import('@playwright/test').Page> }) =>
  page.getByRole('main');

const getStep1Card = ({ page }: { page: NonNullable<import('@playwright/test').Page> }) =>
  page.getByRole('article', { name: STEP1_TITLE });

Then('Step 1 shows as pending on the hub', async ({ page }) => {
  if (!page) {
    return;
  }

  const hub = getOnboardingHub({ page });
  const step1Card = getStep1Card({ page });
  await expect(hub.getByText(ONBOARDING_HEADING)).toBeVisible();
  await expect(step1Card.getByRole('heading', { name: STEP1_TITLE })).toBeVisible();
  await expect(step1Card.getByText(/pending/i)).toBeVisible();
});

Then('Step 1 shows as complete on the hub', async ({ page }) => {
  if (!page) {
    return;
  }

  const step1Card = getStep1Card({ page });
  await expect(step1Card.getByRole('heading', { name: STEP1_TITLE })).toBeVisible();
  await expect(step1Card.getByText(/verified/i)).toBeVisible();
});

Then('Step 2 is locked on the hub', async ({ page }) => {
  if (!page) {
    return;
  }

  const hub = getOnboardingHub({ page });
  await expect(hub.getByRole('button', { name: /add ai integration/i })).toBeDisabled();
});

Then('Step 2 is unlocked on the hub', async ({ page }) => {
  if (!page) {
    return;
  }

  const hub = getOnboardingHub({ page });
  await expect(hub.getByRole('button', { name: /add ai integration/i })).toBeEnabled();
});

Then('no redirect to {string} occurs', async ({ page }, path: string) => {
  if (!page) {
    return;
  }

  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page).not.toHaveURL(new RegExp(`${escapedPath}(?:\\?|$)`), { timeout: 5_000 });
});

Then('all product routes are accessible without onboarding redirect', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.goto('/agents');
  await expect(page).toHaveURL(/\/agents(?:\?|$)/, { timeout: 15_000 });
  await expect(page).not.toHaveURL(/\/onboarding/);
});

Then('I see the option to resend a verification email', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name: /resend email/i })).toBeVisible();
});

Then('the resend cooldown is shown on the onboarding hub', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(/resend available in \d+s|try again in \d+s/i)).toBeVisible();
});

Then('the "Resend email" button is disabled during cooldown', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name: /resend email/i })).toBeDisabled();
});

Then('I see a retry-capable error message on the onboarding hub', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(/try again|network error|something went wrong/i)).toBeVisible();
});

Then('onboarding is not marked complete in the hub', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(ONBOARDING_HEADING)).toBeVisible();
  await expect(page.getByText(STEP2_TITLE)).toBeVisible();
});

Then('the API response indicates onboarding is incomplete', async ({ world }) => {
  if (!world.lastResponse) {
    throw new Error('No API response stored on world.lastResponse');
  }

  expect(world.lastResponse.status()).toBe(403);
  const body = (await world.lastResponse.json()) as { code?: string; message?: string };
  expect(body.code ?? body.message ?? '').toMatch(/onboarding/i);
});

Then('I am redirected to the captured returnUrl', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const returnUrl = webWorld.capturedReturnUrl ?? '/agents';
  const escapedPath = returnUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page).toHaveURL(new RegExp(`${escapedPath}(?:\\?.*)?$`), { timeout: 20_000 });
});

Then('I am redirected to home instead of the unsafe URL', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page).toHaveURL(/\/(?:\?.*)?$/, { timeout: 20_000 });
  await expect(page).not.toHaveURL(/evil\.example\.com/);
});

Then('the onboarding gate is re-evaluated correctly', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page).toHaveURL(/\/onboarding(?:\?|$)/, { timeout: 15_000 });
  await expect(page.getByText(ONBOARDING_HEADING)).toBeVisible();
});

Then('I see a prompt that Step 1 must be completed first', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(/complete step 1|verify your email first/i)).toBeVisible();
});

Then('I see a generic retry message without internal error details', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(/try again|something went wrong/i)).toBeVisible();
  await expect(page.getByText(/internal server error|stack trace|500/i)).not.toBeVisible();
});
