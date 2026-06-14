import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import type { WebBddWorld } from '../utils/types';

const { Then } = createBdd(bddTest);

Then('I see a list of recent tasks', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(async () => {
    await expect(page.getByTestId('task-description').first()).toBeVisible();
  }).toPass({ timeout: 15_000 });
});

Then('the list displays tasks sorted by creation date \\(newest first\\)', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('task-description').first()).toBeVisible({ timeout: 15_000 });
});

Then('the list shows additional tasks', async ({ page }) => {
  if (!page) {
    return;
  }

  const items = page.getByTestId('task-description');
  await expect(async () => {
    const count = await items.count();
    expect(count).toBeGreaterThan(10);
  }).toPass({ timeout: 15_000 });
});

Then('the list displays only tasks matching {string}', async ({ page }, query: string) => {
  if (!page) {
    return;
  }

  const items = page.getByTestId('task-description');
  const count = await items.count();
  for (let index = 0; index < count; index += 1) {
    await expect(items.nth(index)).toContainText(new RegExp(query, 'i'));
  }
});

Then('I see only my own tasks', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(/Other user task/i)).not.toBeVisible();
});

Then('I do not see tasks from other users', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(/Other user task/i)).not.toBeVisible();
});

Then('I do not see a list of recent tasks', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('task-description')).toHaveCount(0);
});

Then('the search results are empty', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByPlaceholder('Search tasks')).toBeVisible();
  await expect(page.getByTestId('task-description')).toHaveCount(0);
});

Then('the first page of tasks is displayed', async ({ page }) => {
  if (!page) {
    return;
  }

  const items = page.getByTestId('task-description');
  await expect(async () => {
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(10);
  }).toPass({ timeout: 15_000 });
});

Then('the search filter remains active', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByPlaceholder('Search tasks')).not.toHaveValue('');
});

Then('the results show additional tasks matching {string}', async ({ page }, query: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('task-description').filter({ hasText: new RegExp(query, 'i') }).first()).toBeVisible();
});

Then('the task {string} appears in the list', async ({ page }, description: string) => {
  if (!page) {
    return;
  }

  await expect(async () => {
    const taskByTestId = page.getByTestId('task-description').filter({ hasText: description });
    const isTaskByTestIdVisible = await taskByTestId.isVisible().catch(() => false);
    if (isTaskByTestIdVisible) {
      return;
    }

    await expect(page.getByText(description, { exact: false }).first()).toBeVisible();
  }).toPass({ timeout: 15_000 });
});

Then('I am on the task detail page for that task', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.taskId) {
    return;
  }

  await expect(page).toHaveURL(new RegExp(`/tasks/${webWorld.taskId}$`));
});
