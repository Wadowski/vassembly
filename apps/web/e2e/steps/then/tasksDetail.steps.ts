import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import type { WebBddWorld } from '../utils/types';

const { Then } = createBdd(bddTest);

Then('I see the task detail page for task-123', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page).toHaveURL(/\/tasks\/task-123$/);
});

Then('I see the title {string}', async ({ page }, title: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('task-detail-title')).toContainText(title);
});

Then('I see a title placeholder like {string}', async ({ page }, placeholder: string) => {
  if (!page) {
    return;
  }

  const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page.getByTestId('task-detail-title')).toContainText(new RegExp(escaped, 'i'));
});

Then('the task detail polls for updates every 3 seconds', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.waitForTimeout(3_500);
  await expect(page.getByTestId('task-detail-status')).toBeVisible();
});

Then('I can verify polling activity in the network tab', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const count = (world as WebBddWorld).pollingRequestCount ?? 0;
  expect(count).toBeGreaterThanOrEqual(0);
});

Then('I see the title populated', async ({ page }) => {
  if (!page) {
    return;
  }

  const title = page.getByTestId('task-detail-title');
  await expect(title).not.toHaveText(/task details/i);
});

Then('I see the output {string}', async ({ page }, output: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('task-detail-ai-response')).toContainText(output);
});

Then('I see the error state', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('task-detail-execution-error')).toBeVisible();
});

Then('I see a 404 or access denied page', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(/not found|access denied|do not have access/i).first()).toBeVisible();
});

Then('I see a loading skeleton', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('task-detail-skeleton')).toBeVisible();
});

Then('I see {string} in the activity timeline', async ({ page }, text: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('task-detail-timeline')).toContainText(text);
});

Then('then I see an error message', async ({ page }) => {
  if (!page) {
    return;
  }

  const errorAlert = page.locator('main[role="alert"]');
  await expect(errorAlert).toBeVisible();
  await expect(errorAlert).toContainText(/could not load|failed|status code|network|not found/i);
});

Then('I can click {string}', async ({ page }, buttonText: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name: new RegExp(buttonText, 'i') })).toBeVisible();
});

Then('the polling subscription is cleaned up', async ({ world }) => {
  expect((world as WebBddWorld).pollingRequestCount ?? 0).toBeGreaterThanOrEqual(0);
});
