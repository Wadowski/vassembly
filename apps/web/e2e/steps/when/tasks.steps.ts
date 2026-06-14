import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

const SEARCH_DEBOUNCE_MS = 400;
const TASK_INPUT_PLACEHOLDER = 'What needs to be done?';

When('I fill in the search field with {string}', async ({ page }, query: string) => {
  if (!page) {
    return;
  }

  const searchField = page.getByPlaceholder('Search tasks');
  await expect(searchField).toBeVisible({ timeout: 15_000 });
  await searchField.fill(query);
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS);
});

When('I click on the task {string}', async ({ page }, taskText: string) => {
  if (!page) {
    return;
  }

  await page.getByTestId('task-description').filter({ hasText: taskText }).first().click();
});

When('I click the back link', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.getByTestId('task-detail-back').click();
});

When('I create a task with description {string}', async ({ page }, description: string) => {
  if (!page) {
    return;
  }

  const createTaskButton = page.getByRole('button', { name: /Create Task/i });

  await page.getByPlaceholder(TASK_INPUT_PLACEHOLDER).fill(description);
  await expect(createTaskButton).toBeEnabled({ timeout: 10_000 });

  await expect(async () => {
    const createTaskResponse = page.waitForResponse(
      (response) => response.url().includes('/tasks') && response.request().method() === 'POST',
      { timeout: 10_000 },
    );
    const listRefreshResponse = page
      .waitForResponse(
        (response) =>
          response.url().includes('/graphql') &&
          response.request().postData()?.includes('ListUserTasks') === true &&
          response.ok(),
        { timeout: 20_000 },
      )
      .catch(() => undefined);

    await createTaskButton.click();
    const response = await createTaskResponse;
    expect(response.ok()).toBe(true);
    await listRefreshResponse;
  }).toPass({ timeout: 20_000 });
});

When('I navigate directly to {string}', async ({ page }, path: string) => {
  if (!page) {
    return;
  }

  await page.goto(path);
});

When('I navigate to its detail page', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.taskId) {
    return;
  }

  await page.goto(`/tasks/${webWorld.taskId}`);
});

When('I reload the page', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.reload();
});

When('the task list fetch fails', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.route('**/graphql**', (route) => {
    if (route.request().postData()?.includes('userTasks')) {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });
});

When('the GraphQL fetch fails on first attempt', async ({ page, world }) => {
  if (!page) {
    return;
  }

  let attempt = 0;
  await page.route('**/graphql**', async (route) => {
    if (route.request().postData()?.includes('task(')) {
      attempt += 1;
      (world as WebBddWorld).pollingRequestCount = attempt;
      if (attempt === 1) {
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
    }
    return route.continue();
  });
});

When('I log out', async ({ page, world }) => {
  if (page) {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  world.auth = null;
});

When('I navigate away from the detail page', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.goto('/');
});

When("I navigate to that task's detail page", async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.otherUserTaskId) {
    return;
  }

  await page.goto(`/tasks/${webWorld.otherUserTaskId}`);
});

When('polling is active', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.waitForTimeout(500);
});
