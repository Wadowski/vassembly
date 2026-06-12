import { randomUUID } from 'node:crypto';

import { createBdd } from 'playwright-bdd';

import type { Page } from '@playwright/test';

import { bddTest } from '@vassembly/e2e';

const { When, Given } = createBdd(bddTest);

const REGISTER_API_PATTERN = '**/user/register';

const fillRequiredRegistrationFields = async ({ page }: { page: Page }): Promise<void> => {
  await page.getByLabel('First Name', { exact: true }).fill('Test');
  await page.getByLabel('Last Name', { exact: true }).fill('User');
  await page.getByRole('checkbox', { name: /privacy policy/i }).check();
  await page.getByRole('checkbox', { name: /terms and conditions/i }).check();
};

When('I fill in required registration fields', async ({ page }) => {
  if (!page) {
    return;
  }

  await fillRequiredRegistrationFields({ page });
});

When('I submit the registration form ignoring browser validation', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.locator('form[role="form"]').evaluate((form) => {
    form.setAttribute('novalidate', '');
    form.requestSubmit();
  });
});

When('I fill in a unique registration email', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const email = `e2e-register-${randomUUID()}@vassembly.test`;
  world.storedFields = { ...world.storedFields, registrationEmail: email };
  await page.getByLabel('Email', { exact: true }).fill(email);
});

Given('the registration API requires email verification', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.route(REGISTER_API_PATTERN, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        authToken: 'e2e-auth-token',
        refreshToken: 'e2e-refresh-token',
        user: {
          id: randomUUID(),
          email: 'verify@example.com',
          firstName: 'Test',
          lastName: 'User',
          verifiedAt: null,
        },
        requiresEmailVerification: true,
      }),
    });
  });
});
