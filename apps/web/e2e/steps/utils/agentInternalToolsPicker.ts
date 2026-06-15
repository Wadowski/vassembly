import { expect, type Locator } from '@playwright/test';

import { dismissNavigationDrawer } from './settingsPage';

type Page = NonNullable<import('@playwright/test').Page>;

export const INTERNAL_TOOL_ASSIGNMENT_PICKER_ID = 'agent-internal-tool-assignment';

export const getInternalToolPicker = ({ page }: { page: Page }): Locator =>
  page.locator(`#${INTERNAL_TOOL_ASSIGNMENT_PICKER_ID}`);

export const openInternalToolPicker = async ({ page }: { page: Page }): Promise<Locator> => {
  await dismissNavigationDrawer({ page });

  const toolPicker = getInternalToolPicker({ page });
  await toolPicker.scrollIntoViewIfNeeded();
  await expect(toolPicker).toBeEnabled({ timeout: 20_000 });
  await toolPicker.click();

  const listboxId = await toolPicker.getAttribute('aria-controls');
  expect(listboxId).not.toBeNull();

  const listbox = page.locator(`#${listboxId as string}`);
  await expect(listbox).toBeVisible({ timeout: 5_000 });

  return listbox;
};
