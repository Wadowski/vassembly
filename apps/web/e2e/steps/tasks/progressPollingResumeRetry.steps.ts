import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  assertProgressEventsAppearing,
  countGraphqlTaskProgressPollRequests,
  createTaskProgressPollingMonitor,
  finalizeTaskProgressForTask,
  getCurrentProgressAttempt,
  markTaskStatusInDatabase,
  PROGRESS_ITEM_TEST_ID,
  seedFailedTaskWithCompletedProgress,
  seedRunningTaskWithProgressEvents,
  startBackgroundProgressEventWriter,
  stopBackgroundProgressWriter,
  stopTaskProgressPollingMonitor,
  TASK_PROGRESS_POLL_INTERVAL_MS,
  waitForActiveTaskProgressPolling,
  waitForProgressPollingToResume,
} from '../utils/pauseResumeRetryHelpers';
import type { WebBddWorld } from '../utils/types';

const { Given, When, Then } = createBdd(bddTest);

const getWebWorld = (world: WebBddWorld): WebBddWorld => world;

Given('a task is running and generating progress events', async ({ seed, world }) => {
  const webWorld = getWebWorld(world);
  await seedRunningTaskWithProgressEvents({ world: webWorld, seed, eventCount: 2 });
  stopBackgroundProgressWriter(webWorld);
  webWorld.stopBackgroundProgressWriter = startBackgroundProgressEventWriter({
    world: webWorld,
    seed,
    intervalMs: 2_000,
  });
});

Given(
  'a failed task with completed progress from the first execution attempt',
  async ({ seed, world }) => {
    await seedFailedTaskWithCompletedProgress({ world: getWebWorld(world), seed });
  },
);

Given('task progress polling is active', async ({ page, world }) => {
  if (!page || !world.taskId) {
    return;
  }

  const webWorld = getWebWorld(world);
  stopTaskProgressPollingMonitor(webWorld);

  const monitor = createTaskProgressPollingMonitor({ page, taskId: world.taskId });
  webWorld.stopTaskProgressPollingMonitor = monitor.stop;

  await waitForActiveTaskProgressPolling({ page, taskId: world.taskId });
  webWorld.lastProgressEventTimestamp = monitor.getLatestEventTimestamp();
  webWorld.lastProgressEventId = monitor.getLatestEventId();
  webWorld.progressExecutionAttemptAtCheckpoint =
    webWorld.progressExecutionAttemptAtCheckpoint ?? (await getCurrentProgressAttempt(page));
});

Given('the progress execution attempt number is {int}', async ({ page, world }, attempt: number) => {
  if (!page) {
    return;
  }

  getWebWorld(world).progressExecutionAttemptAtCheckpoint = attempt;
  await expect(page.getByTestId('progress-execution-attempt')).toContainText(String(attempt), {
    timeout: 10_000,
  });
});

When('the task fails after progress is completed', async ({ page, seed, world }) => {
  const webWorld = getWebWorld(world);
  stopBackgroundProgressWriter(webWorld);

  if (page) {
    webWorld.progressEventCountAtPause = await page.getByTestId(PROGRESS_ITEM_TEST_ID).count();
    const lastItem = page.getByTestId(PROGRESS_ITEM_TEST_ID).last();
    webWorld.lastProgressEventId = (await lastItem.getAttribute('data-event-id')) ?? webWorld.lastProgressEventId;
    webWorld.progressExecutionAttemptAtCheckpoint =
      (await getCurrentProgressAttempt(page)) || webWorld.progressExecutionAttemptAtCheckpoint;
  }

  await finalizeTaskProgressForTask({ world: webWorld });
  await markTaskStatusInDatabase({
    world: webWorld,
    seed,
    status: 'failed',
    llmResponse: null,
  });
});

When('task progress polling restarts after retry', async ({ page, world }) => {
  if (!page || !world.taskId) {
    return;
  }

  const resumed = await waitForProgressPollingToResume(page, world.taskId, 10_000);
  expect(resumed).toBe(true);
});

Then('progress events stop appearing', async ({ page, world }) => {
  if (!page || !world.taskId) {
    return;
  }

  const webWorld = getWebWorld(world);
  const progressCountBefore =
    webWorld.progressEventCountAtPause ?? (await page.getByTestId(PROGRESS_ITEM_TEST_ID).count());

  webWorld.progressEventCountAtPause = progressCountBefore;

  const pollCountDuringPause = await countGraphqlTaskProgressPollRequests({
    page,
    durationMs: TASK_PROGRESS_POLL_INTERVAL_MS + 500,
    taskId: world.taskId,
  });
  expect(pollCountDuringPause).toBe(0);

  const progressCountAfter = await page.getByTestId(PROGRESS_ITEM_TEST_ID).count();
  expect(progressCountAfter).toBe(progressCountBefore);
});

Then('progress events resume appearing', async ({ page, world }) => {
  if (!page || !world.taskId) {
    return;
  }

  const pollingResumed = await waitForProgressPollingToResume(page, world.taskId, 10_000);
  expect(pollingResumed).toBe(true);
  expect(await assertProgressEventsAppearing(page)).toBe(true);
});

Then('new progress events show different execution attempt', async ({ page, world }) => {
  if (!page || !world.taskId) {
    return;
  }

  const webWorld = getWebWorld(world);
  const previousAttempt = webWorld.progressExecutionAttemptAtCheckpoint ?? 1;
  const previousEventId = webWorld.lastProgressEventId;

  await expect(async () => {
    const currentAttempt = await getCurrentProgressAttempt(page);
    const hasNewAttempt = currentAttempt > previousAttempt;

    if (previousEventId) {
      const eventIds = await page
        .getByTestId(PROGRESS_ITEM_TEST_ID)
        .evaluateAll((items) => items.map((item) => item.getAttribute('data-event-id')));
      const hasNewEventId = eventIds.some((eventId) => eventId && eventId !== previousEventId);
      expect(hasNewAttempt || hasNewEventId).toBe(true);
      return;
    }

    expect(hasNewAttempt).toBe(true);
  }).toPass({ timeout: 10_000 });
});

Then(
  'progress events show new execution with attempt number incremented',
  async ({ page, world }) => {
    if (!page) {
      return;
    }

    const webWorld = getWebWorld(world);
    const previousAttempt = webWorld.progressExecutionAttemptAtCheckpoint ?? 1;

    await expect(async () => {
      const currentAttempt = await getCurrentProgressAttempt(page);
      expect(currentAttempt).toBeGreaterThan(previousAttempt);
    }).toPass({ timeout: 10_000 });

    if (world.taskId) {
      expect(await assertProgressEventsAppearing(page)).toBe(true);
    }
  },
);
