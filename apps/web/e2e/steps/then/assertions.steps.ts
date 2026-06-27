import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  getDiscoverMcpLink,
  getYourMcpsMcpLink,
  resolveMcpStatusBadgeLabel,
  waitForMcpListing,
} from '../utils/mcpListing';

const REDIRECT_TIMEOUT_MS = 15_000;

const { Then } = createBdd(bddTest);

const MCP_DETAIL_LAYOUT_TEST_ID = 'mcp-detail-mobile-layout';

Then('I see the MCP detail page', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId(MCP_DETAIL_LAYOUT_TEST_ID)).toBeVisible();
});

Then('I see {string} on the MCP detail page', async ({ page }, text: string) => {
  if (!page) {
    return;
  }

  const detailPage = page.getByTestId(MCP_DETAIL_LAYOUT_TEST_ID);
  await expect(detailPage.getByText(text)).toBeVisible();
});

Then('I see a {string} badge for {string}', async ({ page }, badgeLabel: string, mcpName: string) => {
  if (!page) {
    return;
  }

  const statusLabel = resolveMcpStatusBadgeLabel(badgeLabel);

  await expect(async () => {
    const yourMcpsCard = getYourMcpsMcpLink({ page, mcpName });

    if ((await yourMcpsCard.count()) > 0) {
      await expect(yourMcpsCard.getByLabel(`Status: ${statusLabel}`)).toBeVisible();
      return;
    }

    await expect(getDiscoverMcpLink({ page, mcpName }).getByLabel(`Status: ${statusLabel}`)).toBeVisible();
  }).toPass({ timeout: 20_000 });
});

Then('I do not see the MCP {string}', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  await expect(getDiscoverMcpLink({ page, mcpName })).not.toBeVisible();
});

Then('I do not see a {string} badge for {string}', async ({ page }, badgeLabel: string, mcpName: string) => {
  if (!page) {
    return;
  }

  const statusLabel = resolveMcpStatusBadgeLabel(badgeLabel);

  await expect(async () => {
    await page.reload();
    await waitForMcpListing({ page });

    const discoverCard = getDiscoverMcpLink({ page, mcpName });
    await expect(discoverCard.getByLabel(`Status: ${statusLabel}`)).not.toBeVisible();

    const yourMcpsCard = getYourMcpsMcpLink({ page, mcpName });
    if ((await yourMcpsCard.count()) > 0) {
      await expect(yourMcpsCard.getByLabel(`Status: ${statusLabel}`)).not.toBeVisible();
    }
  }).toPass({ timeout: 20_000 });
});

Then('I am redirected to {string}', async ({ page }, path: string) => {
  if (!page) {
    return;
  }

  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page).toHaveURL(new RegExp(`${escapedPath}(\\?.*)?$`), {
    timeout: REDIRECT_TIMEOUT_MS,
  });
});

Then('the {string} button should be disabled', async ({ page }, name: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name })).toBeDisabled();
});

Then('the {string} button should be enabled', async ({ page }, name: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name })).toBeEnabled();
});

Then('I should see field error {string}', async ({ page }, errorText: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(errorText)).toBeVisible();
});

Then('the form should still be visible', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.locator('form')).toBeVisible();
});

Then('I see a {string} button', async ({ page }, buttonText: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name: new RegExp(buttonText, 'i') }).first()).toBeVisible();
});
