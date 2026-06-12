import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  getAgentDataRow,
  getAgentListSection,
  waitForAgentCreateFormReady,
  waitForAgentEditPageReady,
  waitForAgentListReady,
} from '../utils/agentsListing';
import { ensurePageAuthenticated, signInSeededUser } from '../utils/auth';
import { resolveWorldPath } from '../utils/resolveWorldPath';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

const SEARCH_DEBOUNCE_MS = 500;

const navigateWithAuth = async ({
  page,
  world,
  path,
}: {
  page: NonNullable<import('@playwright/test').Page>;
  world: WebBddWorld;
  path: string;
}): Promise<void> => {
  const resolvedPath = resolveWorldPath({ path, world });
  const email = world.auth?.email;

  await expect(async () => {
    if (email) {
      await ensurePageAuthenticated({ page, email });
    }

    await page.unroute('**/graphql**').catch(() => undefined);
    await page.goto(resolvedPath, { waitUntil: 'domcontentloaded' });

    if (email && /\/login(?:\?|$)/.test(page.url())) {
      await signInSeededUser({ page, email });
      await page.goto(resolvedPath, { waitUntil: 'domcontentloaded' });
    }
  }).toPass({ timeout: 45_000 });
};

When('I open the agents list', async ({ page, world }) => {
  if (!page) {
    return;
  }

  await navigateWithAuth({ page, world: world as WebBddWorld, path: '/agents' });
  await waitForAgentListReady({ page });
});

When('I open the agent edit page', async ({ page, world }) => {
  if (!page) {
    return;
  }

  await navigateWithAuth({
    page,
    world: world as WebBddWorld,
    path: '/agents/{agentId}/edit',
  });
  await waitForAgentEditPageReady({ page });
});

When('I fill in the search box with {string}', async ({ page }, query: string) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
  const listResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/graphql') &&
      response.request().postData()?.includes('ListAgents') === true &&
      response.ok(),
    { timeout: 20_000 },
  );
  await page.getByPlaceholder('Search by name or description…').fill(query);
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS);
  await listResponse.catch(() => undefined);
});

When('I click the edit button for {string}', async ({ page }, agentName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
  const editButton = getAgentDataRow(page, agentName).getByRole('button', { name: /^Edit$/i });
  await Promise.all([page.waitForURL(/\/agents\/[^/]+\/edit/), editButton.click()]);
  await waitForAgentEditPageReady({ page });
});

When('I click the delete button for {string}', async ({ page }, agentName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
  await getAgentDataRow(page, agentName).getByRole('button', { name: /^Delete$/i }).click();
});

When('I click the restore button for {string}', async ({ page }, agentName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
  await getAgentDataRow(page, agentName).getByRole('button', { name: /^Restore$/i }).click();
});

When('I click the create agent button', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
  await getAgentListSection(page).getByRole('button', { name: 'Create Agent', exact: true }).click();
});

When('I confirm the delete dialog', async ({ page }) => {
  if (!page) {
    return;
  }

  const listResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/graphql') &&
      response.request().postData()?.includes('ListAgents') === true &&
      response.ok(),
    { timeout: 20_000 },
  );
  const dialog = page.getByRole('dialog', { name: /delete agent/i });
  await dialog.getByRole('button', { name: /^Delete$/i }).click();
  await listResponse.catch(() => undefined);
  await waitForAgentListReady({ page });
});

When('I confirm the restore dialog', async ({ page }) => {
  if (!page) {
    return;
  }

  const listResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/graphql') &&
      response.request().postData()?.includes('ListAgents') === true &&
      response.ok(),
    { timeout: 20_000 },
  );
  const dialog = page.getByRole('dialog', { name: /restore agent/i });
  await dialog.getByRole('button', { name: /^Restore$/i }).click();
  await listResponse.catch(() => undefined);
});

When('I filter agents by status {string}', async ({ page }, statusLabel: string) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
  const listResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/graphql') &&
      response.request().postData()?.includes('ListAgents') === true &&
      response.ok(),
    { timeout: 20_000 },
  );
  await page.locator('#agent-status-filter').click();
  await page.getByRole('option', { name: statusLabel, exact: true }).click();
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS);
  await listResponse.catch(() => undefined);
});

When('I select {string} for {string}', async ({ page }, optionLabel: string, fieldLabel: string) => {
  if (!page) {
    return;
  }

  const dropdownId = fieldLabel === 'Category' ? 'agent-category' : fieldLabel.toLowerCase().replace(/\s+/g, '-');
  await page.locator(`#${dropdownId}`).click();
  await page.getByRole('option', { name: optionLabel, exact: true }).click();
});

When('I select the AI integration {string}', async ({ page }, integrationName: string) => {
  if (!page) {
    return;
  }

  const integrationOption = page.getByRole('option', { name: new RegExp(integrationName, 'i') });
  await expect(async () => {
    await page.locator('#agent-integration-credential').click();
    await expect(integrationOption).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await integrationOption.click();
});

When('I open the agent create form', async ({ page, world }) => {
  if (!page) {
    return;
  }

  await navigateWithAuth({ page, world: world as WebBddWorld, path: '/agents/create' });
  await waitForAgentCreateFormReady({ page });
});

When('I try to open the agent create form', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.goto('/agents/create', { waitUntil: 'domcontentloaded' });
});

When('I submit the agent form', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForAgentCreateFormReady({ page });
  await page.locator('main form').evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
  });
});

When('I blur the {string} field', async ({ page }, label: string) => {
  if (!page) {
    return;
  }

  const resolvedLabel = label === 'Instructions' ? 'Rule' : label;
  await page.getByLabel(resolvedLabel, { exact: true }).blur();
});

When('I click {string} to see page {int}', async ({ page }, buttonText: string, pageNumber: number) => {
  if (!page) {
    return;
  }

  const paginationButton = page.getByRole('button', { name: new RegExp(buttonText, 'i') });
  await paginationButton.first().click();

  if (pageNumber > 1) {
    await page.getByRole('button', { name: String(pageNumber) }).click();
  }
});

When('I see the confirmation modal', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.getByRole('dialog').waitFor({ state: 'visible' });
});
