import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';
import {
  getAgentDataRow,
  getAgentListSection,
  waitForAgentEditPageReady,
  waitForAgentListReady,
} from '../utils/agentsListing';
import { resolveWorldPath } from '../utils/resolveWorldPath';

import type { WebBddWorld } from '../utils/types';

const { Then } = createBdd(bddTest);

const FORM_LABEL_ALIASES: Record<string, string> = {
  instructions: 'Rule',
};

Then('I see the agents list page', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
});

Then('I see agent {string} in the list', async ({ page }, agentName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
  await expect(async () => {
    await expect(getAgentDataRow(page, agentName)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
});

Then('I do not see agent {string} in the list', async ({ page }, agentName: string) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
  await expect(async () => {
    await expect(getAgentDataRow(page, agentName)).not.toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
});

Then('I see the agent form error {string}', async ({ page }, errorText: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(errorText, { exact: true })).toBeVisible();
});

Then('I see the agent creation form', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('heading', { name: /Create agent/i })).toBeVisible();
  await expect(page.getByLabel('Name')).toBeVisible();
});

Then('I am still on {string}', async ({ page, world }, path: string) => {
  if (!page) {
    return;
  }

  const resolvedPath = resolveWorldPath({ path, world: world as WebBddWorld });
  const escapedPath = resolvedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page).toHaveURL(new RegExp(`${escapedPath}$`));
});

Then('the form shows {string} in the name field', async ({ page }, value: string) => {
  if (!page) {
    return;
  }

  await waitForAgentEditPageReady({ page });
  await expect(page.getByLabel('Name')).toHaveValue(value);
});

Then('the form shows {string} in the description field', async ({ page }, value: string) => {
  if (!page) {
    return;
  }

  await waitForAgentEditPageReady({ page });
  await expect(page.getByLabel('Description')).toHaveValue(value);
});

Then('the form shows {string} in the instructions field', async ({ page }, value: string) => {
  if (!page) {
    return;
  }

  await waitForAgentEditPageReady({ page });
  const label = FORM_LABEL_ALIASES.instructions ?? 'Rule';
  await expect(page.getByLabel(label)).toHaveValue(value);
});

Then('I see a confirmation modal', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('dialog')).toBeVisible();
});

Then('the modal contains {string}', async ({ page }, text: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('dialog').getByText(text, { exact: false })).toBeVisible();
});

Then('I do not see the confirmation modal', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('dialog')).not.toBeVisible();
});

Then('the agent status changes to {string}', async ({ page }, status: string) => {
  if (!page) {
    return;
  }

  await waitForAgentListReady({ page });
  await expect(getAgentListSection(page).getByText(status, { exact: true }).first()).toBeVisible();
});

Then('the agents list loads successfully', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('heading', { name: 'My Agents', exact: true })).toBeVisible();
});

Then('I see the agent snackbar {string}', async ({ page }, message: string) => {
  if (!page) {
    return;
  }

  await expect(async () => {
    await expect(page.getByText(message, { exact: false })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 10_000 });
});
