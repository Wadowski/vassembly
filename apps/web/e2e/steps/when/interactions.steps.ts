import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { getDiscoverMcpLink, waitForMcpListing } from '../utils/mcpListing';

const { When } = createBdd(bddTest);

const SEARCH_DEBOUNCE_MS = 400;

When('I click on the MCP {string}', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  await waitForMcpListing({ page });

  const mcpLink = getDiscoverMcpLink({ page, mcpName });
  await mcpLink.click();
  await page.waitForURL(/\/mcps\/[^/]+$/, { timeout: 15_000 });
  await page.getByTestId('mcp-detail-mobile-layout').waitFor({ timeout: 15_000 });
});

When('I search MCPs for {string}', async ({ page }, query: string) => {
  if (!page) {
    return;
  }

  await waitForMcpListing({ page });
  await page.getByPlaceholder('Search by name or description').fill(query);
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS);
});

When('I filter MCPs by tag {string}', async ({ page }, tag: string) => {
  if (!page) {
    return;
  }

  await waitForMcpListing({ page });
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: tag, exact: true }).click();
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS);
});

When(
  'I submit the reset form with the token and new password {string}',
  async ({ page, world }, newPassword: string) => {
    if (!page) {
      return;
    }

    const { resetToken } = world;
    if (!resetToken) {
      throw new Error('No reset token available. Use "Given I have a valid password reset token for {string}" first.');
    }

    await page.goto(`/reset-password?token=${resetToken}`);
    await page.getByLabel('New Password').fill(newPassword);

    const confirmField = page.getByLabel('Confirm Password');
    const confirmExists = await confirmField.isVisible().catch(() => false);
    if (confirmExists) {
      await confirmField.fill(newPassword);
    }

    await page.getByRole('button', { name: /reset password/i }).click();
  },
);
