import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  getSpecializationCardLink,
  waitForSpecializationListing,
} from '../utils/specializationListing';

const { Then } = createBdd(bddTest);

const DETAIL_READY_TIMEOUT_MS = 15_000;

Then('I see the specializations list page', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForSpecializationListing({ page });
});

Then('I see specialization {string} in the list', async ({ page }, specializationName: string) => {
  if (!page) {
    return;
  }

  await expect(getSpecializationCardLink({ page, specializationName })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I do not see specialization {string} in the list', async ({ page }, specializationName: string) => {
  if (!page) {
    return;
  }

  await expect(getSpecializationCardLink({ page, specializationName })).not.toBeVisible();
});

Then('I see specialization list pagination controls', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByLabel('Specialization list pagination')).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see the linked agents section', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('region', { name: 'Linked Agents' })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see the specialization detail page', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('specialization-detail-page')).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see {string} as the specialization name', async ({ page }, name: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see linked agent {string}', async ({ page }, agentName: string) => {
  if (!page) {
    return;
  }

  const agentsPanel = page.getByRole('region', { name: 'Linked Agents' });
  await expect(agentsPanel.getByText(agentName, { exact: true })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I do not see linked agent {string}', async ({ page }, agentName: string) => {
  if (!page) {
    return;
  }

  const agentsPanel = page.getByRole('region', { name: 'Linked Agents' });
  await expect(agentsPanel.getByText(agentName, { exact: true })).not.toBeVisible();
});

Then('I see MCP {string} mapped to the specialization', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  const mcpsPanel = page.getByRole('region', { name: 'Mapped MCPs' });
  await expect(mcpsPanel.getByText(mcpName, { exact: true })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see {string} for the missing agent slot', async ({ page }, indicatorText: string) => {
  if (!page) {
    return;
  }

  const agentsPanel = page.getByRole('region', { name: 'Linked Agents' });
  await expect(agentsPanel.getByText(indicatorText, { exact: true })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});
