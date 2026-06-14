import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { waitForAgentEditPageReady } from '../utils/agentsListing';

const { Then } = createBdd(bddTest);

const MCP_DETAIL_LAYOUT_TEST_ID = 'mcp-detail-mobile-layout';

const waitForAgentMcpFormReady = async ({
  page,
}: {
  page: NonNullable<import('@playwright/test').Page>;
}): Promise<void> => {
  await waitForAgentEditPageReady({ page });
  await expect(page.locator('main form')).toBeVisible();
};

const getMcpAgentsSection = (page: NonNullable<import('@playwright/test').Page>) =>
  page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Agents using this MCP', exact: true }),
  });

Then('I see the MCP assignment empty state', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForAgentMcpFormReady({ page });
  await expect(page.getByText('No MCPs configured yet.', { exact: true })).toBeVisible();
});

Then('I see MCP {string} assigned on the agent form', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentMcpFormReady({ page });
  const assignmentSection = page.locator('div').filter({
    has: page.getByText('MCP tools', { exact: true }),
  });
  await expect(assignmentSection.getByText(new RegExp(mcpName, 'i'))).toBeVisible();
});

Then('I do not see MCP {string} assigned on the agent form', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentEditPageReady({ page });
  const assignmentSection = page.locator('div').filter({
    has: page.getByText('MCP tools', { exact: true }),
  });
  await expect(assignmentSection.getByText(new RegExp(mcpName, 'i'))).not.toBeVisible();
});

Then('I see {string} on the MCP assignment picker', async ({ page }, text: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(text, { exact: true })).toBeVisible();
});

Then('I see the MCP agents section on the detail page', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.getByTestId(MCP_DETAIL_LAYOUT_TEST_ID).waitFor({ timeout: 15_000 });
  await expect(getMcpAgentsSection(page)).toBeVisible();
});

Then('I do not see the MCP agents section on the detail page', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.getByTestId(MCP_DETAIL_LAYOUT_TEST_ID).waitFor({ timeout: 15_000 });
  await expect(getMcpAgentsSection(page)).not.toBeVisible();
});

Then('I see agent {string} in the MCP agents section', async ({ page }, agentName: string) => {
  if (!page) {
    return;
  }

  await expect(getMcpAgentsSection(page).getByText(agentName, { exact: true })).toBeVisible({
    timeout: 15_000,
  });
});

Then('I do not see agent {string} in the MCP agents section', async ({ page }, agentName: string) => {
  if (!page) {
    return;
  }

  await expect(getMcpAgentsSection(page).getByText(agentName, { exact: true })).not.toBeVisible({
    timeout: 15_000,
  });
});

Then('I see the MCP agents empty state', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(getMcpAgentsSection(page).getByText('No agents use this MCP yet', { exact: true })).toBeVisible();
});
