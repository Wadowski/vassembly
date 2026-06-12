import { createBdd } from 'playwright-bdd';

import { expect } from '@playwright/test';

import { bddTest } from '@vassembly/e2e';

import { waitForSettingsPageReady } from '../utils/settingsPage';

const { When } = createBdd(bddTest);

const SETTINGS_READY_TIMEOUT_MS = 15_000;

When('I am on the settings page', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/settings(?:\?|$)/, { timeout: SETTINGS_READY_TIMEOUT_MS });
  await waitForSettingsPageReady({ page });
});
