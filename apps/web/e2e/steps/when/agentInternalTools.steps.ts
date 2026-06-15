import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { openInternalToolPicker } from '../utils/agentInternalToolsPicker';
import { waitForAgentEditPageReady } from '../utils/agentsListing';
import { dismissNavigationDrawer } from '../utils/settingsPage';

const { When } = createBdd(bddTest);

When('I add internal tool {string} to the agent form', async ({ page }, toolName: string) => {
  if (!page) {
    return;
  }

  const listbox = await openInternalToolPicker({ page });
  const toolOption = listbox.getByRole('option', { name: new RegExp(`^${toolName}$`, 'i') });
  await expect(toolOption).toBeVisible({ timeout: 5_000 });
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
