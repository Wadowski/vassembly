import { expect } from '@playwright/test';

import { Then } from '../../fixtures/bddTest';

Then('I see {string}', async ({ page }, text: string) => {
  if (!page) {
    return;
  }

  const locator = page.getByText(text, { exact: false });
  await expect(locator.first()).toBeVisible();
});

Then('I do not see {string}', async ({ page }, text: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(text)).not.toBeVisible();
});

Then('I see a success message', async ({ page }) => {
  if (!page) {
    return;
  }

  const successMessage = page.locator('[role="status"], [role="alert"]');
  await expect(successMessage.first()).toBeVisible();
});

Then('the response status is {int}', async ({ world }, status: number) => {
  if (!world.lastResponse) {
    throw new Error('No API response stored on world.lastResponse');
  }

  expect(world.lastResponse.status()).toBe(status);
});
