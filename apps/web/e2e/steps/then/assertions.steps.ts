import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

const { Then } = createBdd(bddTest);

const MCP_DETAIL_LAYOUT_TEST_ID = 'mcp-detail-mobile-layout';

Then('I see the MCP details drawer', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId(MCP_DETAIL_LAYOUT_TEST_ID)).toBeVisible();
});

Then('I see {string} in the drawer', async ({ page }, text: string) => {
  if (!page) {
    return;
  }

  const drawer = page.getByTestId(MCP_DETAIL_LAYOUT_TEST_ID);
  await expect(drawer.getByText(text)).toBeVisible();
});
