import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { waitForAgentEditPageReady } from '../utils/agentsListing';
import { dismissNavigationDrawer } from '../utils/settingsPage';

const { When } = createBdd(bddTest);

const INTERNAL_TOOL_ASSIGNMENT_PICKER_ID = 'agent-internal-tool-assignment';

When('I add internal tool {string} to the agent form', async ({ page }, toolName: string) => {
  if (!page) {
    return;
  }

  await dismissNavigationDrawer({ page });
  const toolPicker = page.locator(`#${INTERNAL_TOOL_ASSIGNMENT_PICKER_ID}`);
  const toolOption = page
    .locator('[role="listbox"]:visible')
    .getByRole('option', { name: new RegExp(`^${toolName}$`, 'i') });

  await expect(async () => {
    await expect(toolPicker).toBeEnabled({ timeout: 2_000 });
    await toolPicker.click();
    await expect(page.locator('[role="listbox"]:visible')).toBeVisible({ timeout: 2_000 });
    await expect(toolOption).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });

  await toolOption.click();
});

When('I remove internal tool {string} from the agent form', async ({ page }, toolName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentEditPageReady({ page });
  await dismissNavigationDrawer({ page });
  await page.getByRole('button', { name: new RegExp(`Remove .*${toolName}`, 'i') }).click();
});
