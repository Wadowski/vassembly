import { createBdd } from 'playwright-bdd';

import { expect } from '@playwright/test';

import { bddTest } from '@vassembly/e2e';

const { Then } = createBdd(bddTest);

const DELETE_ACCOUNT_MODAL_TITLE = 'Delete your account?';
const DELETE_ACCOUNT_CONFIRM_BUTTON_NAME = /^Delete account$/i;

Then('the delete account confirmation button should be disabled', async ({ page }) => {
  if (!page) {
    return;
  }

  const deletionDialog = page.getByRole('dialog', { name: DELETE_ACCOUNT_MODAL_TITLE });
  await expect(
    deletionDialog.getByRole('button', { name: DELETE_ACCOUNT_CONFIRM_BUTTON_NAME }),
  ).toBeDisabled();
});
