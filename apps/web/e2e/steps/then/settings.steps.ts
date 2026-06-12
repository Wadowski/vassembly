import { createBdd } from 'playwright-bdd';

import { expect } from '@playwright/test';

import { bddTest } from '@vassembly/e2e';

const { Then } = createBdd(bddTest);

Then('I see the account settings option', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(
    page.getByRole('menu', { name: 'Account actions' }).getByRole('button', { name: 'Settings' }),
  ).toBeVisible();
});
