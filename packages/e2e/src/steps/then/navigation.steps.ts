import { expect } from '@playwright/test';

import { Then } from '../../fixtures/bddTest';

Then('I am on {string}', async ({ page }, path: string) => {
  if (!page) {
    return;
  }

  await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), {
    timeout: 15_000,
  });
});
