import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { waitForAgentCreateFormReady, waitForAgentEditPageReady } from '../utils/agentsListing';
import { dismissNavigationDrawer } from '../utils/settingsPage';

const { Then } = createBdd(bddTest);

const INTERNAL_TOOL_ASSIGNMENT_PICKER_ID = 'agent-internal-tool-assignment';

const getInternalToolsSection = (page: NonNullable<import('@playwright/test').Page>) =>
  page
    .locator('div')
    .filter({
      has: page.getByText('Internal tools', { exact: true }),
    })
    .last();

const getMcpToolsSection = (page: NonNullable<import('@playwright/test').Page>) =>
  page
    .locator('div')
    .filter({
      has: page.getByText('MCP tools', { exact: true }),
    })
    .last();

const openInternalToolPicker = async ({
  page,
}: {
  page: NonNullable<import('@playwright/test').Page>;
}): Promise<void> => {
  await dismissNavigationDrawer({ page });
  const toolPicker = page.locator(`#${INTERNAL_TOOL_ASSIGNMENT_PICKER_ID}`);
  await expect(toolPicker).toBeEnabled({ timeout: 20_000 });
  await toolPicker.click();
  await expect(page.locator('[role="listbox"]:visible')).toBeVisible({ timeout: 5_000 });
};

Then('I see the internal tools picker on the agent form', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForAgentCreateFormReady({ page });
  await expect(page.locator(`#${INTERNAL_TOOL_ASSIGNMENT_PICKER_ID}`)).toBeVisible();
  await expect(
    page.getByText('Platform capabilities such as listing agents and delegating to another agent.', {
      exact: true,
    }),
  ).toBeVisible();
});

Then('I see the internal tools catalog loaded on the agent form', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForAgentCreateFormReady({ page });
  await openInternalToolPicker({ page });
  const listbox = page.locator('[role="listbox"]:visible');
  await expect(listbox.getByRole('option', { name: /^Use agent$/i })).toBeVisible();
  await expect(listbox.getByRole('option', { name: /^List agents$/i })).toBeVisible();
  await page.keyboard.press('Escape');
});

Then('I see internal tool {string} available on the agent form', async ({ page }, toolName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentCreateFormReady({ page });
  await openInternalToolPicker({ page });
  await expect(
    page.locator('[role="listbox"]:visible').getByRole('option', { name: new RegExp(`^${toolName}$`, 'i') }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
});

Then('I see distinct MCP and internal tools sections on the agent form', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForAgentCreateFormReady({ page });
  await expect(getMcpToolsSection(page)).toBeVisible();
  await expect(getInternalToolsSection(page)).toBeVisible();
  await expect(getMcpToolsSection(page).getByText('MCP tools', { exact: true })).toBeVisible();
  await expect(getInternalToolsSection(page).getByText('Internal tools', { exact: true })).toBeVisible();
  await expect(
    getInternalToolsSection(page).locator(`#${INTERNAL_TOOL_ASSIGNMENT_PICKER_ID}`),
  ).toBeVisible();
});

Then('I see internal tool {string} assigned on the agent form', async ({ page }, toolName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentEditPageReady({ page });
  await dismissNavigationDrawer({ page });
  await expect(getInternalToolsSection(page).getByText(new RegExp(toolName, 'i'))).toBeVisible();
});

Then('I do not see internal tool {string} assigned on the agent form', async ({ page }, toolName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentEditPageReady({ page });
  await dismissNavigationDrawer({ page });
  await expect(getInternalToolsSection(page).getByText(new RegExp(toolName, 'i'))).not.toBeVisible();
});
