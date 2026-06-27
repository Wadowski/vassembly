import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  INTERNAL_TOOL_ASSIGNMENT_PICKER_ID,
  openInternalToolPicker,
} from '../utils/agentInternalToolsPicker';
import { waitForAgentCreateFormReady, waitForAgentEditPageReady } from '../utils/agentsListing';
import { dismissNavigationDrawer } from '../utils/settingsPage';

const { Then } = createBdd(bddTest);

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

Then('I see the internal tools picker on the agent form', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForAgentCreateFormReady({ page });
  const toolPicker = page.locator(`#${INTERNAL_TOOL_ASSIGNMENT_PICKER_ID}`);
  await toolPicker.scrollIntoViewIfNeeded();
  await expect(toolPicker).toBeVisible();
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

  const listbox = await openInternalToolPicker({ page });
  await expect(listbox.getByRole('option', { name: /^agent - use$/i })).toBeVisible();
  await expect(listbox.getByRole('option', { name: /^agent - list$/i })).toBeVisible();
  await page.keyboard.press('Escape');
});

Then('I see internal tool {string} available on the agent form', async ({ page }, toolName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentCreateFormReady({ page });
  const listbox = await openInternalToolPicker({ page });
  await expect(listbox.getByRole('option', { name: new RegExp(`^${toolName}$`, 'i') })).toBeVisible();
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
