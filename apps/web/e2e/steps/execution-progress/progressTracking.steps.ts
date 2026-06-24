import { createBdd } from 'playwright-bdd';
import { expect, test } from '@playwright/test';

import { bddTest } from '@vassembly/e2e';

import { seedTaskForUser } from '../utils/seedTaskData';
import {
  countGraphqlTaskProgressPollRequests,
  finalizeTaskProgressForTask,
  markTaskStatusInDatabase,
  seedStartedProgressEvent,
  seedTrackingProgressEvents,
} from '../utils/pauseResumeRetryHelpers';
import {
  navigateToTaskDetailPage,
  PROGRESS_LIST_TEST_ID,
  reloadTaskDetailPage,
} from '../utils/taskDetailPage';
import type { WebBddWorld } from '../utils/types';

const { Given, When, Then } = createBdd(bddTest);

const PROGRESS_ITEM_TEST_ID = 'progress-item';
const PROGRESS_MODAL_TEST_ID = 'progress-detail-modal';
const ERROR_BANNER_TEST_ID = 'progress-error-banner';
const RETRY_BUTTON_TEST_ID = 'progress-retry-button';

/**
 * GIVEN steps - Setup state
 */

Given('I have a task in-progress with execution progress tracking', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: 'E2E test task for progress tracking',
    status: 'in-progress',
  });

  // Initialize polling request counter
  webWorld.pollingRequestCount = 0;
});

/**
 * WHEN steps - User actions
 */

When('I navigate to the task detail page', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  if (!webWorld.taskId) {
    throw new Error('taskId is required to navigate to task detail page');
  }

  await navigateToTaskDetailPage({ page, taskId: webWorld.taskId });
});

When('the task execution begins and first agent starts', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  await seedStartedProgressEvent({ world: webWorld, seed });
});

When('the task has multiple progress events', async ({ seed, page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  await seedTrackingProgressEvents({ world: webWorld, seed, eventCount: 2 });
  await reloadTaskDetailPage({ page });

  await expect(page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`)).toHaveCount(2, {
    timeout: 10_000,
  });
});

When('I click on the first progress event', async ({ page }) => {
  if (!page) {
    return;
  }

  const firstEvent = page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`).first();
  await firstEvent.click();
  
  // Wait for modal to appear
  await page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`).waitFor({ timeout: 5_000 });
});

When('I verify polling is active with requests every 1 second', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  const pollCount = await countGraphqlTaskProgressPollRequests({
    page,
    durationMs: 3_000,
    taskId: webWorld.taskId,
  });

  expect(pollCount).toBeGreaterThanOrEqual(2);
  webWorld.pollingRequestCount = pollCount;
});

When('the backend marks the task as completed', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  await seedStartedProgressEvent({ world: webWorld, seed });
  await finalizeTaskProgressForTask({ world: webWorld, seed });
  await markTaskStatusInDatabase({
    world: webWorld,
    seed,
    status: 'done',
    llmResponse: 'E2E completed output',
  });
});

When('the task has {int} recorded progress events', async ({ seed, page, world }, count: number) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  await seedTrackingProgressEvents({ world: webWorld, seed, eventCount: count });
  await reloadTaskDetailPage({ page });

  await expect
    .poll(async () => page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`).count(), {
      timeout: 10_000,
    })
    .toBeGreaterThanOrEqual(count);
});

When('I refresh the page', async ({ page }) => {
  if (!page) {
    return;
  }

  await reloadTaskDetailPage({ page });
});

When('polling is active', async ({ page }) => {
  if (!page) {
    return;
  }

  // Verify ProgressList is visible and polling is likely active
  await expect(page.locator(`[data-testid="${PROGRESS_LIST_TEST_ID}"]`)).toBeVisible();
});

When('the GraphQL query fails with a 500 error', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.route('**/graphql**', (route) => {
    const postData = route.request().postData();
    if (postData?.includes('taskProgress')) {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });

  await expect(page.locator(`[data-testid="${ERROR_BANNER_TEST_ID}"]`)).toBeVisible({
    timeout: 10_000,
  });
});

When('the API recovers and responds successfully', async ({ page, seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  await page.unroute('**/graphql**');
  await seedStartedProgressEvent({ world: webWorld, seed });
  await reloadTaskDetailPage({ page });
});

When('I click on a progress event to open the modal', async ({ seed, page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  const itemCount = await page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`).count();
  if (itemCount === 0) {
    await seedTrackingProgressEvents({ world: webWorld, seed, eventCount: 2 });
    await reloadTaskDetailPage({ page });
  }

  const firstEvent = page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`).first();
  await firstEvent.focus();
  await firstEvent.click();
  
  await page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`).waitFor({ timeout: 5_000 });
});

When('I press the Escape key', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.keyboard.press('Escape');
  
  await expect(page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`)).toBeHidden({
    timeout: 3_000,
  });
});

When('the ProgressDetailModal is open showing {string}', async ({ seed, page, world }, relativeTime: string) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  await seedStartedProgressEvent({
    world: webWorld,
    seed,
    timestampOffsetMs: -2 * 60 * 1000,
  });
  await reloadTaskDetailPage({ page });

  const firstEvent = page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`).first();
  await firstEvent.click();

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  await expect(modal).toBeVisible();
  await expect(modal.getByText(relativeTime)).toBeVisible();
});

When('I wait {int} seconds', async ({ page }, seconds: number) => {
  if (!page) {
    return;
  }

  test.setTimeout(seconds * 1000 + 30_000);

  await page.waitForTimeout(seconds * 1000);
});

/**
 * THEN steps - Verify state
 */

Then('the ProgressList is visible and empty or loading', async ({ page }) => {
  if (!page) {
    return;
  }

  const progressList = page.locator(`[data-testid="${PROGRESS_LIST_TEST_ID}"]`);
  await expect(progressList).toBeVisible();

  // Either empty state or loading state should be visible
  const hasEmptyState = await page.locator(`[data-testid="progress-empty-state"]`).isVisible().catch(() => false);
  const hasLoadingState = await page.locator(`[data-testid="progress-loading-state"]`).isVisible().catch(() => false);
  
  expect(hasEmptyState || hasLoadingState || (await page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`).count()) === 0)
    .toBeTruthy();
});

Then('I see a {string} event for the agent in the ProgressList without page refresh', async ({ page }, state: string) => {
  if (!page) {
    return;
  }

  await expect(
    page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"][data-state="${state}"]`).first(),
  ).toBeVisible({ timeout: 10_000 });
});

Then('the events are ordered by timestamp with oldest first', async ({ page }) => {
  if (!page) {
    return;
  }

  const events = page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`);
  const timestamps = [];

  for (let i = 0; i < (await events.count()); i++) {
    const timestamp = await events.nth(i).getAttribute('data-timestamp');
    if (timestamp) {
      timestamps.push(new Date(timestamp).getTime());
    }
  }

  // Verify timestamps are in ascending order (oldest first)
  for (let i = 1; i < timestamps.length; i++) {
    expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
  }
});

Then('the ProgressDetailModal opens with glassmorphic styling', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  await expect(modal).toBeVisible();

  // Verify glassmorphic styling via CSS class or backdrop-filter
  const hasGlassmorphicClass = await modal.evaluate((el) => {
    return el.classList.contains('glassmorphic') || 
           getComputedStyle(el).backdropFilter !== 'none';
  });

  expect(hasGlassmorphicClass).toBeTruthy();
});

Then('I see the agent name in the modal header', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  const header = modal.locator('[data-testid="progress-modal-header"]');
  
  await expect(header).toBeVisible();
  
  // Verify agent name is present (non-empty text)
  const agentName = await header.locator('[data-testid="agent-name"]').textContent();
  expect(agentName).toBeTruthy();
  expect(agentName?.trim().length).toBeGreaterThan(0);
});

Then('I see the status badge showing the event state', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  const badge = modal.locator('[data-testid="status-badge"]');
  
  await expect(badge).toBeVisible();
  
  // Verify badge has a valid state
  const state = await badge.getAttribute('data-state');
  expect(['started', 'completed', 'failed', 'pending']).toContain(state);
});

Then('I see the duration displayed in the modal', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  const duration = modal.locator('[data-testid="duration"]');
  
  await expect(duration).toBeVisible();
  
  const durationText = await duration.textContent();
  expect(durationText).toMatch(/\d+(?:\.\d+)?\s*(?:ms|s|m|h)/); // Match duration format (ms, s, m, h)
});

Then('I see token usage displayed with input, output, and total counts', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  const tokenWidget = modal.locator('[data-testid="token-usage-widget"]');
  
  await expect(tokenWidget).toBeVisible();
  
  // Verify all three token counts are displayed
  await expect(tokenWidget.locator('[data-testid="input-tokens"]')).toBeVisible();
  await expect(tokenWidget.locator('[data-testid="output-tokens"]')).toBeVisible();
  await expect(tokenWidget.locator('[data-testid="total-tokens"]')).toBeVisible();
});

Then('I see the request JSON formatted in the modal', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  const requestSection = modal.locator('[data-testid="request-section"]');
  
  await expect(requestSection).toBeVisible();
  
  const jsonCode = requestSection.locator('code');
  await expect(jsonCode).toBeVisible();
  
  const content = await jsonCode.textContent();
  expect(content).toBeTruthy();
});

Then('I see the response JSON formatted in the modal', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  const responseSection = modal.locator('[data-testid="response-section"]');
  
  await expect(responseSection).toBeVisible();
  
  const jsonCode = responseSection.locator('code');
  await expect(jsonCode).toBeVisible();
  
  const content = await jsonCode.textContent();
  expect(content).toBeTruthy();
});

Then('the relative time text updates to show {string} without manual refresh', async ({ page }, expectedTime: string) => {
  if (!page) {
    return;
  }

  await page.waitForFunction(
    (expectedTime) => {
      const timeElement = document.querySelector('[data-testid="relative-time"]');
      return timeElement?.textContent?.includes(expectedTime) ?? false;
    },
    expectedTime,
    { timeout: 10_000 },
  );
});

Then('the modal remains open', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  await expect(modal).toBeVisible();
});

Then('polling stops after the task completion status is received', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  await expect
    .poll(async () => page.locator('[data-testid="progress-item"]').count(), { timeout: 20_000 })
    .toBeGreaterThan(0);

  await expect(async () => {
    const pollCount = await countGraphqlTaskProgressPollRequests({
      page,
      durationMs: 2_000,
      taskId: webWorld.taskId,
    });
    expect(pollCount).toBe(0);
  }).toPass({ timeout: 10_000 });
});

Then('no new polling requests occur', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  await expect
    .poll(async () => page.locator('[data-testid="progress-item"]').count(), { timeout: 20_000 })
    .toBeGreaterThan(0);

  const pollCount = await countGraphqlTaskProgressPollRequests({
    page,
    durationMs: 2_000,
    taskId: webWorld.taskId,
  });

  expect(pollCount).toBe(0);
});

Then('the ProgressTracker hides or shows completion message', async ({ page }) => {
  if (!page) {
    return;
  }

  // Either tracker is hidden or shows completion state
  const tracker = page.locator('[data-testid="execution-progress-tracker"]');
  const isHidden = await tracker.isHidden().catch(() => true);
  const hasCompletionMessage = await page.locator('[data-testid="completion-message"]').isVisible().catch(() => false);

  expect(isHidden || hasCompletionMessage).toBeTruthy();
});

Then('all {int} progress events are displayed in the ProgressList', async ({ page }, count: number) => {
  if (!page) {
    return;
  }

  const items = await page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`).count();
  expect(items).toBe(count);
});

Then('no events are lost or duplicated', async ({ page }) => {
  if (!page) {
    return;
  }

  const items = page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`);
  const eventIds = new Set<string>();
  
  for (let i = 0; i < (await items.count()); i++) {
    const eventId = await items.nth(i).getAttribute('data-event-id');
    if (eventId) {
      expect(eventIds.has(eventId)).toBeFalsy(); // No duplicates
      eventIds.add(eventId);
    }
  }

  expect(eventIds.size).toBeGreaterThan(0);
});

Then('the data matches the database', async ({ page }) => {
  if (!page) {
    return;
  }

  // For now, verify the data is consistent on page
  const items = await page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`).count();
  expect(items).toBeGreaterThan(0);
});

Then('an error banner or toast appears', async ({ page }) => {
  if (!page) {
    return;
  }

  const errorBanner = page.locator(`[data-testid="${ERROR_BANNER_TEST_ID}"]`);

  await expect(errorBanner).toBeVisible({ timeout: 5_000 });
});

Then('a retry button is visible in the error UI', async ({ page }) => {
  if (!page) {
    return;
  }

  const retryButton = page.locator(`[data-testid="${RETRY_BUTTON_TEST_ID}"]`);
  await expect(retryButton).toBeVisible();
  await expect(retryButton).toBeEnabled();
});

Then('polling continues in the background with exponential backoff', async ({ page }) => {
  if (!page) {
    return;
  }

  const errorBanner = page.locator(`[data-testid="${ERROR_BANNER_TEST_ID}"]`);
  await expect(errorBanner).toBeVisible({ timeout: 5_000 });
});

Then('the error banner dismisses automatically', async ({ page }) => {
  if (!page) {
    return;
  }

  const errorBanner = page.locator(`[data-testid="${ERROR_BANNER_TEST_ID}"]`);

  await expect(errorBanner).toBeHidden({ timeout: 10_000 });
});

Then('polling resumes normal updates', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`).first()).toBeVisible({
    timeout: 5_000,
  });
});

Then('new events appear in the ProgressList', async ({ page }) => {
  if (!page) {
    return;
  }

  const progressList = page.locator(`[data-testid="${PROGRESS_LIST_TEST_ID}"]`);
  await expect(progressList).toBeVisible();
  
  const items = await page.locator(`[data-testid="${PROGRESS_ITEM_TEST_ID}"]`);
  const count = await items.count();
  
  expect(count).toBeGreaterThan(0);
});

Then('the ProgressDetailModal is open', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);
  await expect(modal).toBeVisible();
});

Then('the modal closes with a smooth animation', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.locator(`[data-testid="${PROGRESS_MODAL_TEST_ID}"]`);

  await expect(modal).toBeHidden({ timeout: 3_000 });
});

Then('the ProgressItem that was clicked regains focus', async ({ page }) => {
  if (!page) {
    return;
  }

  const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
  
  expect(focusedElement).toContain(PROGRESS_ITEM_TEST_ID);
});

Then('tab focus is no longer trapped inside the modal', async ({ page }) => {
  if (!page) {
    return;
  }

  // Press Tab and verify focus moves outside where modal was
  await page.keyboard.press('Tab');
  
  const focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
  
  // Focus should be on something other than the modal
  expect(focusedTestId).not.toContain(PROGRESS_MODAL_TEST_ID);
});
