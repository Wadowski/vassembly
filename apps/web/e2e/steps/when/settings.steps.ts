import { createBdd } from 'playwright-bdd';

import { expect } from '@playwright/test';

import { bddTest } from '@vassembly/e2e';

import {
  clickSettingsButton,
  dismissNavigationDrawer,
  fillSettingsField,
  waitForSettingsPageReady,
} from '../utils/settingsPage';

const { When } = createBdd(bddTest);

const SIGN_OUT_MODAL_TITLE = 'Sign out?';
const SETTINGS_READY_TIMEOUT_MS = 15_000;

When('I open the navigation menu', async ({ page }) => {
  if (!page) {
    return;
  }

  await dismissNavigationDrawer({ page });
  const menuButton = page.getByRole('button', { name: /open menu/i });
  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true', { timeout: 5_000 });
});

When('I navigate to settings from the menu', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.getByRole('menu', { name: 'Account actions' }).getByRole('button', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings(?:\?|$)/, { timeout: SETTINGS_READY_TIMEOUT_MS });
  await waitForSettingsPageReady({ page });
});

When('I fill in the settings field {string} with {string}', async ({ page }, label: string, value: string) => {
  if (!page) {
    return;
  }

  await fillSettingsField({ page, label, value });
});

When('I click the settings button {string}', async ({ page }, name: string) => {
  if (!page) {
    return;
  }

  await clickSettingsButton({ page, name });
});

When('I confirm sign out in the modal', async ({ page }) => {
  if (!page) {
    return;
  }

  const signOutDialog = page.getByRole('dialog', { name: SIGN_OUT_MODAL_TITLE });
  await expect(signOutDialog).toBeVisible();
  await signOutDialog.getByRole('button', { name: /^Sign out$/i }).click();
});
