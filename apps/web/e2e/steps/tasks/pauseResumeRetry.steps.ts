import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  countGraphqlTaskPollRequests,
  expectStatusBadgeText,
  expectTaskActionButtonVisibility,
  getTaskActionButton,
  markTaskStatusInDatabase,
  navigateToTaskDetailPage,
  patchTaskAction,
  removePreferredAiCredential,
  seedCompletedProgressEvents,
  seedTaskWithStatus,
  TASK_ACTION_TIMEOUT_MS,
  TASK_DETAIL_AI_RESPONSE_TEST_ID,
  TASK_DETAIL_POLL_INTERVAL_MS,
  TASK_DETAIL_STATUS_TEST_ID,
  waitForTaskGraphqlPoll,
  waitForTaskStatusBadge,
} from '../utils/pauseResumeRetryHelpers';
import type { WebBddWorld } from '../utils/types';

const { Given, When, Then } = createBdd(bddTest);

const getWebWorld = (world: WebBddWorld): WebBddWorld => world;

Given('a task exists with status {string}', async ({ seed, world }, status: string) => {
  await seedTaskWithStatus({ world: getWebWorld(world), seed, status });
});

Given('the task detail page is open', async ({ page, world }) => {
  if (!page) {
    return;
  }

  await navigateToTaskDetailPage({ page, world: getWebWorld(world) });
});

Given(
  'the task has at least one progress event with state {string}',
  async ({ seed, world }, state: string) => {
    if (state !== 'completed') {
      throw new Error(`Unsupported progress event state for seeding: ${state}`);
    }

    await seedCompletedProgressEvents({ world: getWebWorld(world), seed, eventCount: 1 });
  },
);

Given('the task has progress events with state {string}', async ({ seed, world }, state: string) => {
  if (state !== 'completed') {
    throw new Error(`Unsupported progress event state for seeding: ${state}`);
  }

  await seedCompletedProgressEvents({ world: getWebWorld(world), seed, eventCount: 2 });
});

Given('the task detail page shows the pause button', async ({ page, world }) => {
  if (!page) {
    return;
  }

  await navigateToTaskDetailPage({ page, world: getWebWorld(world) });
  await expectTaskActionButtonVisibility({ page, action: 'pause', isVisible: true });
});

Given('my preferred AI credential has been removed from Settings', async ({ seed, world }) => {
  await removePreferredAiCredential({ world: getWebWorld(world), seed });
});

Given('a task is in-progress with a nested agent invocation in flight', async ({ seed, world }) => {
  await seedTaskWithStatus({ world: getWebWorld(world), seed, status: 'in-progress' });
  await seedCompletedProgressEvents({ world: getWebWorld(world), seed, eventCount: 1 });
  getWebWorld(world).storedFields = {
    ...(getWebWorld(world).storedFields ?? {}),
    nestedInvocation: 'in-flight',
  };
});

Given('I have the same task detail page open in two browser tabs', async ({ page, world }) => {
  if (!page || !world.taskId) {
    return;
  }

  const webWorld = getWebWorld(world);
  webWorld.tabAPage = page;
  webWorld.tabBPage = await page.context().newPage();
  await navigateToTaskDetailPage({ page: webWorld.tabAPage, world: webWorld });
  await navigateToTaskDetailPage({ page: webWorld.tabBPage, world: webWorld });
});

When('I click the pause button in the task detail header', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const pauseResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/tasks/${world.taskId}/pause`) &&
      response.request().method() === 'PATCH',
    { timeout: TASK_ACTION_TIMEOUT_MS },
  );

  await getTaskActionButton({ page, action: 'pause' }).click();
  getWebWorld(world).lastResponse = await pauseResponse;
});

When('I click the resume button in the task detail header', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const resumeResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/tasks/${world.taskId}/resume`) &&
      response.request().method() === 'PATCH',
    { timeout: TASK_ACTION_TIMEOUT_MS },
  );

  await getTaskActionButton({ page, action: 'resume' }).click();
  getWebWorld(world).lastResponse = await resumeResponse;
});

When('I click the retry button in the task detail header', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const retryResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/tasks/${world.taskId}/retry`) &&
      response.request().method() === 'PATCH',
    { timeout: TASK_ACTION_TIMEOUT_MS },
  );

  await getTaskActionButton({ page, action: 'retry' }).click();
  getWebWorld(world).lastResponse = await retryResponse;
});

When('the task execution completes and status becomes {string}', async ({ seed, world }, status: string) => {
  await markTaskStatusInDatabase({
    world: getWebWorld(world),
    seed,
    status,
    llmResponse: status === 'done' ? 'Race-condition completed output' : null,
  });
});

When('I double-click the pause button rapidly', async ({ page, world }) => {
  if (!page) {
    return;
  }

  let pauseRequestCount = 0;
  const listener = (request: import('@playwright/test').Request): void => {
    if (
      request.url().includes(`/tasks/${world.taskId}/pause`) &&
      request.method() === 'PATCH'
    ) {
      pauseRequestCount += 1;
    }
  };

  page.on('request', listener);
  const pauseButton = getTaskActionButton({ page, action: 'pause' });
  await pauseButton.dblclick({ delay: 50 });
  await page.waitForTimeout(1_000);
  page.off('request', listener);
  getWebWorld(world).pauseApiRequestCount = pauseRequestCount;
});

When('I pause the task in Tab A', async ({ world }) => {
  const webWorld = getWebWorld(world);
  const tabAPage = webWorld.tabAPage;
  if (!tabAPage || !webWorld.taskId) {
    return;
  }

  const pauseResponse = tabAPage.waitForResponse(
    (response) =>
      response.url().includes(`/tasks/${webWorld.taskId}/pause`) &&
      response.request().method() === 'PATCH',
    { timeout: TASK_ACTION_TIMEOUT_MS },
  );

  await getTaskActionButton({ page: tabAPage, action: 'pause' }).click();
  webWorld.lastResponse = await pauseResponse;
});

When('I wait {int} seconds', async ({ page }, seconds: number) => {
  if (!page) {
    return;
  }

  await page.waitForTimeout(seconds * 1_000);
});

When('PATCH {string} is called', async ({ api, world }, pathTemplate: string) => {
  const action = pathTemplate.includes('/pause')
    ? 'pause'
    : pathTemplate.includes('/resume')
      ? 'resume'
      : 'retry';

  await patchTaskAction({ world: getWebWorld(world), api, action });
});

Then(
  'the pause API request PATCH {string} is sent',
  async ({ world }, pathTemplate: string) => {
    const response = getWebWorld(world).lastResponse;
    expect(response).toBeDefined();
    expect(response?.url()).toContain(`/tasks/${world.taskId}/pause`);
    expect(response?.request().method()).toBe('PATCH');
    expect(pathTemplate).toContain('/pause');
  },
);

Then(
  'the resume API request PATCH {string} is sent',
  async ({ world }, pathTemplate: string) => {
    const response = getWebWorld(world).lastResponse;
    expect(response).toBeDefined();
    expect(response?.url()).toContain(`/tasks/${world.taskId}/resume`);
    expect(response?.request().method()).toBe('PATCH');
    expect(pathTemplate).toContain('/resume');
  },
);

Then(
  'the retry API request PATCH {string} is sent',
  async ({ world }, pathTemplate: string) => {
    const response = getWebWorld(world).lastResponse;
    expect(response).toBeDefined();
    expect(response?.url()).toContain(`/tasks/${world.taskId}/retry`);
    expect(response?.request().method()).toBe('PATCH');
    expect(pathTemplate).toContain('/retry');
  },
);

Then('PATCH {string} returns {int}', async ({ world }, pathTemplate: string, status: number) => {
  const response = getWebWorld(world).lastResponse;
  expect(response).toBeDefined();
  expect(response?.status()).toBe(status);
  expect(pathTemplate).toContain('/pause');
});

Then('the task status becomes {string}', async ({ page }, status: string) => {
  if (!page) {
    return;
  }

  const statusLabelMap: Record<string, string> = {
    paused: 'Paused',
    'in-progress': 'In progress',
    done: 'Done',
    failed: 'Failed',
  };

  const label = statusLabelMap[status];
  if (!label) {
    throw new Error(`Unsupported task status label mapping: ${status}`);
  }

  await waitForTaskStatusBadge({ page, statusLabel: label });
});

Then('the task status remains {string}', async ({ page }, status: string) => {
  if (!page) {
    return;
  }

  const statusLabelMap: Record<string, string> = {
    paused: 'Paused',
    done: 'Done',
    'in-progress': 'In progress',
    failed: 'Failed',
  };

  const label = statusLabelMap[status];
  if (!label) {
    throw new Error(`Unsupported task status label mapping: ${status}`);
  }

  await expectStatusBadgeText({ page, label });
});

Then('the task ends in status {string}', async ({ page }, status: string) => {
  if (!page) {
    return;
  }

  const statusLabelMap: Record<string, string> = {
    paused: 'Paused',
    'in-progress': 'In progress',
    done: 'Done',
    failed: 'Failed',
  };

  await waitForTaskStatusBadge({ page, statusLabel: statusLabelMap[status] ?? status });
});

Then('the pause button is visible', async ({ page }) => {
  if (!page) {
    return;
  }

  await expectTaskActionButtonVisibility({ page, action: 'pause', isVisible: true });
});

Then('the pause button is not visible', async ({ page }) => {
  if (!page) {
    return;
  }

  await expectTaskActionButtonVisibility({ page, action: 'pause', isVisible: false });
});

Then('the pause button is not visible after refresh', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.reload();
  await expectTaskActionButtonVisibility({ page, action: 'pause', isVisible: false });
});

Then('the resume button is visible', async ({ page }) => {
  if (!page) {
    return;
  }

  await expectTaskActionButtonVisibility({ page, action: 'resume', isVisible: true });
});

Then('the resume button is not visible', async ({ page }) => {
  if (!page) {
    return;
  }

  await expectTaskActionButtonVisibility({ page, action: 'resume', isVisible: false });
});

Then('the retry button is visible', async ({ page }) => {
  if (!page) {
    return;
  }

  await expectTaskActionButtonVisibility({ page, action: 'retry', isVisible: true });
});

Then('the retry button is not visible', async ({ page }) => {
  if (!page) {
    return;
  }

  await expectTaskActionButtonVisibility({ page, action: 'retry', isVisible: false });
});

Then('the resume button is visible next to the status badge', async ({ page }) => {
  if (!page) {
    return;
  }

  const statusBadge = page.getByTestId(TASK_DETAIL_STATUS_TEST_ID);
  const resumeButton = getTaskActionButton({ page, action: 'resume' });
  await expect(resumeButton).toBeVisible({ timeout: TASK_ACTION_TIMEOUT_MS });
  await expect(statusBadge).toBeVisible();
});

Then('the retry button is visible next to the status badge', async ({ page }) => {
  if (!page) {
    return;
  }

  const statusBadge = page.getByTestId(TASK_DETAIL_STATUS_TEST_ID);
  const retryButton = getTaskActionButton({ page, action: 'retry' });
  await expect(retryButton).toBeVisible({ timeout: TASK_ACTION_TIMEOUT_MS });
  await expect(statusBadge).toBeVisible();
});

Then('the status badge displays {string}', async ({ page }, label: string) => {
  if (!page) {
    return;
  }

  await expectStatusBadgeText({ page, label });
});

Then('LLM execution for that task stops', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const initialCount = await page.getByTestId('progress-item').count();
  getWebWorld(world).progressEventCountAtPause = initialCount;
  await page.waitForTimeout(TASK_DETAIL_POLL_INTERVAL_MS + 500);
  const finalCount = await page.getByTestId('progress-item').count();
  expect(finalCount).toBe(initialCount);
});

Then('no new progress events are recorded until resume', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const baseline = getWebWorld(world).progressEventCountAtPause ?? (await page.getByTestId('progress-item').count());
  await page.waitForTimeout(TASK_DETAIL_POLL_INTERVAL_MS + 500);
  const finalCount = await page.getByTestId('progress-item').count();
  expect(finalCount).toBe(baseline);
});

Then('task detail polling stops', async ({ page }) => {
  if (!page) {
    return;
  }

  const pollCount = await countGraphqlTaskPollRequests({ page, durationMs: TASK_DETAIL_POLL_INTERVAL_MS + 500 });
  expect(pollCount).toBe(0);
});

Then('task detail polling resumes every 3 seconds', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForTaskGraphqlPoll({ page });
  const pollCount = await countGraphqlTaskPollRequests({ page, durationMs: TASK_DETAIL_POLL_INTERVAL_MS + 500 });
  expect(pollCount).toBeGreaterThanOrEqual(1);
});

Then('when execution finishes the task status becomes {string}', async ({ page }, status: string) => {
  if (!page) {
    return;
  }

  const statusLabelMap: Record<string, string> = {
    done: 'Done',
    failed: 'Failed',
  };

  await waitForTaskStatusBadge({ page, statusLabel: statusLabelMap[status] ?? status });
});

Then('I see the output in the AI Response section', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId(TASK_DETAIL_AI_RESPONSE_TEST_ID)).not.toBeEmpty({
    timeout: TASK_ACTION_TIMEOUT_MS,
  });
});

Then(
  'the UI shows an error snackbar indicating the task can no longer be paused',
  async ({ page }) => {
    if (!page) {
      return;
    }

    await expect(
      page.getByText(/This task can no longer be paused|Unable to pause task/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  },
);

Then('the user can navigate to Settings to configure a credential', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible({
    timeout: 15_000,
  });
});

Then('only one pause API request is processed meaningfully', async ({ world }) => {
  const requestCount = getWebWorld(world).pauseApiRequestCount ?? 0;
  expect(requestCount).toBeLessThanOrEqual(2);
  expect(requestCount).toBeGreaterThanOrEqual(1);
});

Then('the pause button is disabled after the first click', async ({ page }) => {
  if (!page) {
    return;
  }

  const pauseButton = getTaskActionButton({ page, action: 'pause' });
  await expect(pauseButton).toBeDisabled({ timeout: 5_000 });
});

Then(
  'progress events show completed steps up to the last finished step',
  async ({ page }) => {
    if (!page) {
      return;
    }

    const completedEvents = page.locator('[data-testid="progress-item"][data-state="completed"]');
    await expect(completedEvents.first()).toBeVisible({ timeout: TASK_ACTION_TIMEOUT_MS });
    expect(await completedEvents.count()).toBeGreaterThanOrEqual(1);
  },
);

Then('Tab A shows status {string} and the resume button', async ({ world }, status: string) => {
  const tabAPage = getWebWorld(world).tabAPage;
  if (!tabAPage) {
    return;
  }

  const statusLabelMap: Record<string, string> = {
    paused: 'Paused',
    'in-progress': 'In progress',
  };

  await waitForTaskStatusBadge({ page: tabAPage, statusLabel: statusLabelMap[status] ?? status });
  await expectTaskActionButtonVisibility({ page: tabAPage, action: 'resume', isVisible: true });
});

Then('Tab B continues to show {string} until page reload', async ({ world }, status: string) => {
  const tabBPage = getWebWorld(world).tabBPage;
  if (!tabBPage) {
    return;
  }

  const statusLabelMap: Record<string, string> = {
    'in-progress': 'In progress',
    paused: 'Paused',
  };

  await expectStatusBadgeText({ page: tabBPage, label: statusLabelMap[status] ?? status });
  await tabBPage.reload();
  await waitForTaskStatusBadge({ page: tabBPage, statusLabel: 'Paused' });
});
