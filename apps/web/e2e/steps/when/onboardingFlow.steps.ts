import { createBdd } from 'playwright-bdd';

import { expect } from '@playwright/test';

import { getE2eEnvironment, bddTest } from '@vassembly/e2e';

import { clearBrowserSession, signInSeededUser } from '../utils/auth';
import { setupAiIntegrationCreateRoutes } from '../utils/setupAiIntegrationCreateRoutes';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

const E2E_ONBOARDING_INTEGRATION_NAME = 'E2E Onboarding Integration';
const E2E_ONBOARDING_API_KEY = 'e2e-onboarding-api-key';

const fillOnboardingAiIntegrationForm = async ({
  page,
}: {
  page: NonNullable<import('@playwright/test').Page>;
}): Promise<void> => {
  await page.getByLabel('Name', { exact: true }).fill(E2E_ONBOARDING_INTEGRATION_NAME);
  await page.getByLabel('API Key', { exact: true }).fill(E2E_ONBOARDING_API_KEY);
};

const createFirstAiIntegrationDuringOnboarding = async ({
  page,
}: {
  page: NonNullable<import('@playwright/test').Page>;
}): Promise<void> => {
  await setupAiIntegrationCreateRoutes({ page });
  await page.goto('/agents/ai-integrations/create');
  await fillOnboardingAiIntegrationForm({ page });
  await page.getByRole('button', { name: /test connection/i }).click();
  await expect(page.getByText('Connection verified')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /create integration/i }).click();
};

When('I create my first AI integration during onboarding', async ({ page }) => {
  if (!page) {
    return;
  }

  await createFirstAiIntegrationDuringOnboarding({ page });
});

When('onboarding completes', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  await createFirstAiIntegrationDuringOnboarding({ page });
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });

  const returnUrl = webWorld.capturedReturnUrl;
  if (returnUrl?.startsWith('/')) {
    await expect(page).toHaveURL(new RegExp(returnUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), {
      timeout: 20_000,
    });
  }
});

When(
  'I send an authenticated request to a protected API endpoint outside onboarding scope',
  async ({ api, world }) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.token) {
      throw new Error('User must be authenticated before calling protected API');
    }

    const apiBaseUrl = getE2eEnvironment().apiBaseUrl;
    const response = await api.fetch(`${apiBaseUrl}/agents`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${webWorld.auth.token}` },
    });

    webWorld.lastResponse = response;
  },
);

When('I log in again in a new session', async ({ page, world }) => {
  if (!page || !world.auth?.email) {
    return;
  }

  await clearBrowserSession({ page });
  await signInSeededUser({ page, email: world.auth.email });
});

When('I re-authenticate after session expiry on the onboarding hub', async ({ page, world }) => {
  if (!page || !world.auth?.email) {
    return;
  }

  await signInSeededUser({ page, email: world.auth.email });
  await page.goto('/onboarding');
});
