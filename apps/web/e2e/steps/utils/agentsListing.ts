import { expect } from '@playwright/test';

import { dismissNavigationDrawer } from './settingsPage';

type Page = NonNullable<import('@playwright/test').Page>;

export const getAgentListSection = (page: Page) =>
  page.locator('section').filter({
    has: page.getByRole('heading', { name: 'My Agents', exact: true }),
  });

export const waitForAgentListReady = async ({ page }: { page: Page }): Promise<void> => {
  await expect(page.getByRole('heading', { name: 'My Agents', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByPlaceholder('Search by name or description…')).toBeEnabled({
    timeout: 20_000,
  });
};

export const waitForAgentCreateFormReady = async ({ page }: { page: Page }): Promise<void> => {
  await dismissNavigationDrawer({ page });
  await expect(page.getByRole('heading', { name: /Create agent/i })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('main form')).toBeVisible({ timeout: 20_000 });
  await Promise.all([
    page
      .waitForResponse(
        (response) =>
          response.url().includes('/graphql') &&
          response.request().postData()?.includes('ListAiIntegrations') === true &&
          response.ok(),
        { timeout: 20_000 },
      )
      .catch(() => undefined),
    page
      .waitForResponse(
        (response) =>
          response.url().includes('/graphql') &&
          response.request().postData()?.includes('InternalTools') === true &&
          response.ok(),
        { timeout: 20_000 },
      )
      .catch(() => undefined),
  ]);
  await expect(page.locator('#agent-internal-tool-assignment')).toBeEnabled({ timeout: 20_000 });
};

export const waitForAgentEditPageReady = async ({ page }: { page: Page }): Promise<void> => {
  await expect(async () => {
    if (await page.getByText('Loading…', { exact: false }).isVisible()) {
      throw new Error('Agent edit page is still loading');
    }

    const isErrorVisible =
      (await page.getByText('Agent not found', { exact: false }).isVisible()) ||
      (await page.getByText('Unable to load agent', { exact: false }).isVisible());
    const isFormVisible =
      (await page.getByRole('heading', { name: 'Edit agent' }).isVisible()) ||
      (await page.getByLabel('Name').isVisible());

    if (isErrorVisible || isFormVisible) {
      return;
    }

    throw new Error('Agent edit page is not ready');
  }).toPass({ timeout: 20_000 });
};

export const getAgentDataRow = (page: Page, agentName: string) =>
  getAgentListSection(page).locator('table tbody tr').filter({
    has: page.locator('td').first().getByText(agentName, { exact: true }),
  });
