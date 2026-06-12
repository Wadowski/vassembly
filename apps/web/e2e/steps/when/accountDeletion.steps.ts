import { createBdd } from 'playwright-bdd';

import { expect, type Page } from '@playwright/test';

import { bddTest } from '@vassembly/e2e';

const { When } = createBdd(bddTest);

const DELETE_ACCOUNT_API_PATTERN = '**/user/delete-account';
const ACCOUNT_DELETION_SECTION_SELECTOR = '#account-deletion';
const DELETE_ACCOUNT_MODAL_TITLE = 'Delete your account?';
const DELETE_ACCOUNT_OPEN_BUTTON_NAME = 'Delete account…';
const DELETE_ACCOUNT_CONFIRM_BUTTON_NAME = /^Delete account$/i;
const DELETE_ACCOUNT_SLOW_RESPONSE_MS = 5_000;

const getDeletionDialog = ({ page }: { page: Page }) =>
  page.getByRole('dialog', { name: DELETE_ACCOUNT_MODAL_TITLE });

const mockDeleteAccountSuccess = async ({ page }: { page: Page }): Promise<void> => {
  await page.route(DELETE_ACCOUNT_API_PATTERN, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
};

const mockDeleteAccountSlowSuccess = async ({ page }: { page: Page }): Promise<void> => {
  await page.route(DELETE_ACCOUNT_API_PATTERN, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, DELETE_ACCOUNT_SLOW_RESPONSE_MS);
    });

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
};

When('I open the account deletion modal', async ({ page }) => {
  if (!page) {
    return;
  }

  const dangerZone = page.locator(ACCOUNT_DELETION_SECTION_SELECTOR);
  await expect(dangerZone).toBeVisible({ timeout: 15_000 });
  await dangerZone.scrollIntoViewIfNeeded();
  await dangerZone.getByRole('button', { name: DELETE_ACCOUNT_OPEN_BUTTON_NAME }).click();
  await expect(getDeletionDialog({ page })).toBeVisible();
});

When('I confirm account deletion', async ({ page }) => {
  if (!page) {
    return;
  }

  await mockDeleteAccountSuccess({ page });

  const deletionDialog = getDeletionDialog({ page });
  await deletionDialog.getByRole('button', { name: DELETE_ACCOUNT_CONFIRM_BUTTON_NAME }).click();
});

When('I start account deletion', async ({ page }) => {
  if (!page) {
    return;
  }

  await mockDeleteAccountSlowSuccess({ page });

  const deletionDialog = getDeletionDialog({ page });
  await deletionDialog.getByRole('button', { name: DELETE_ACCOUNT_CONFIRM_BUTTON_NAME }).click();
});

When('I cancel account deletion', async ({ page }) => {
  if (!page) {
    return;
  }

  const deletionDialog = getDeletionDialog({ page });
  await deletionDialog.getByRole('button', { name: /^Cancel$/i }).click();
});
