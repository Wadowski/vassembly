import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { waitForAgentEditPageReady } from '../utils/agentsListing';

const { When } = createBdd(bddTest);

const MCP_DETAIL_LAYOUT_TEST_ID = 'mcp-detail-mobile-layout';
const MCP_ASSIGNMENT_PICKER_ID = 'agent-mcp-assignment';

const waitForMcpAgentsQuery = async ({
  page,
}: {
  page: NonNullable<import('@playwright/test').Page>;
}): Promise<void> => {
  await page
    .waitForResponse(
      (response) =>
        response.url().includes('/graphql') &&
        response.request().postData()?.includes('McpWithAgents') === true &&
        response.ok(),
      { timeout: 20_000 },
    )
    .catch(() => undefined);
};

When('I add MCP {string} to the agent form', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  const mcpPicker = page.locator(`#${MCP_ASSIGNMENT_PICKER_ID}`);
  const mcpOption = page.getByRole('option', { name: new RegExp(mcpName, 'i') });

  await expect(async () => {
    await expect(mcpPicker).toBeEnabled({ timeout: 2_000 });
    await mcpPicker.click();
    await expect(mcpOption).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });

  await mcpOption.click();
});

When('I remove MCP {string} from the agent form', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentEditPageReady({ page });
  await page.getByRole('button', { name: new RegExp(`Remove .*${mcpName}`, 'i') }).click();
});

When(
  'I click {string} for agent {string} on the MCP detail page',
  async ({ page }, buttonLabel: string, agentName: string) => {
    if (!page) {
      return;
    }

    await page.getByTestId(MCP_DETAIL_LAYOUT_TEST_ID).waitFor({ timeout: 15_000 });
    const agentRow = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Agents using this MCP', exact: true }),
    }).locator('div').filter({
      has: page.getByText(agentName, { exact: true }),
    });

    await agentRow.getByRole('button', { name: new RegExp(buttonLabel, 'i') }).click();
  },
);

When('I confirm the unassign MCP modal', async ({ page }) => {
  if (!page) {
    return;
  }

  const dialog = page.getByRole('dialog', { name: /Remove MCP from agent/i });
  const unassignResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/mcps/') &&
      response.url().includes('/agents/') &&
      response.request().method() === 'DELETE',
    { timeout: 15_000 },
  );

  await dialog.getByRole('button', { name: /^Confirm$/i }).click();
  const response = await unassignResponse;
  expect(response.ok()).toBe(true);
  await waitForMcpAgentsQuery({ page });
});
