import { expect } from '@playwright/test';

import { dismissNavigationDrawer } from './settingsPage';

type Page = NonNullable<import('@playwright/test').Page>;

export const waitForSystemAgentFormReady = async ({
  page,
  heading,
}: {
  page: Page;
  heading: RegExp;
}): Promise<void> => {
  await dismissNavigationDrawer({ page });
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('main form')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel('Name')).toBeEnabled({ timeout: 20_000 });
  await expect(page.getByLabel('Rule')).toBeEnabled({ timeout: 20_000 });
};
