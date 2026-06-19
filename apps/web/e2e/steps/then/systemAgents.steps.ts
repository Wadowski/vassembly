import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { waitForSystemAgentFormReady } from '../utils/systemAgentsForm';

const { Then } = createBdd(bddTest);

Then('the system agent form shows {string} in the name field', async ({ page }, value: string) => {
  if (!page) {
    return;
  }

  await waitForSystemAgentFormReady({ page, heading: /system agent/i });
  await expect(page.getByLabel('Name')).toHaveValue(value);
});

Then('the system agent form shows {string} in the description field', async ({ page }, value: string) => {
  if (!page) {
    return;
  }

  await waitForSystemAgentFormReady({ page, heading: /system agent/i });
  await expect(page.getByLabel('Description')).toHaveValue(value);
});

Then('the system agent form shows {string} in the rule field', async ({ page }, value: string) => {
  if (!page) {
    return;
  }

  await waitForSystemAgentFormReady({ page, heading: /system agent/i });
  await expect(page.getByLabel('Rule')).toHaveValue(value);
});
