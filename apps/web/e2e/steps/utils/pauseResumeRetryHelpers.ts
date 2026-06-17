import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { getE2eEnvironment, requireWorkspaceModule } from '@vassembly/e2e';

import { ensureAssistantSystemAgent, ensureTaskDomainIndexes } from './seedTask';
import { seedTaskForUser } from './seedTaskData';
import type { WebBddWorld } from './types';

export const TASK_PAUSE_BUTTON_TEST_ID = 'task-pause-button';
export const TASK_RESUME_BUTTON_TEST_ID = 'task-resume-button';
export const TASK_RETRY_BUTTON_TEST_ID = 'task-retry-button';
export const TASK_DETAIL_STATUS_TEST_ID = 'task-detail-status';
export const TASK_DETAIL_AI_RESPONSE_TEST_ID = 'task-detail-ai-response';

export const TASK_DETAIL_POLL_INTERVAL_MS = 3_000;
export const TASK_PROGRESS_POLL_INTERVAL_MS = 1_000;
export const TASK_ACTION_TIMEOUT_MS = 60_000;
export const PROGRESS_ITEM_TEST_ID = 'progress-item';
export const PROGRESS_EXECUTION_ATTEMPT_TEST_ID = 'progress-execution-attempt';

export interface SeedTaskWithStatusParams {
  world: WebBddWorld;
  seed: import('@vassembly/e2e').SeedContext;
  status: string;
}

export const seedTaskWithStatus = async ({
  world,
  seed,
  status,
}: SeedTaskWithStatusParams): Promise<string> => {
  if (!world.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  const taskId = await seedTaskForUser({
    context: seed,
    userId: world.auth.userId,
    description: `E2E pause-resume task (${status})`,
    title: `Pause resume ${status}`,
    status,
    errorMessage: status === 'failed' ? 'Task failed during execution' : null,
    errorCode: status === 'failed' ? 'E2E_FAILED' : null,
    llmResponse: status === 'done' ? 'E2E completed output' : null,
  });

  world.taskId = taskId;
  return taskId;
};

export interface SeedCompletedProgressEventParams {
  world: WebBddWorld;
  seed: import('@vassembly/e2e').SeedContext;
  eventCount?: number;
}

export const seedCompletedProgressEvents = async ({
  world,
  seed,
  eventCount = 1,
}: SeedCompletedProgressEventParams): Promise<void> => {
  if (!world.auth?.userId || !world.taskId) {
    throw new Error('taskId and logged-in user are required to seed progress events');
  }

  await ensureTaskDomainIndexes({ context: seed });

  const taskProgressDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-progress')>({
    moduleName: '@vassembly/domain-task-progress',
  });
  const { ProgressEventState } = taskProgressDomain;
  const assistantId = await ensureAssistantSystemAgent({ context: seed });

  await taskProgressDomain.default.commands.initializeTaskProgress({
    taskId: world.taskId,
    userId: world.auth.userId,
  });

  for (let index = 0; index < eventCount; index += 1) {
    await taskProgressDomain.default.commands.recordProgressEvent({
      taskId: world.taskId,
      agentId: assistantId,
      state: ProgressEventState.Completed,
      generatedResponse: `Completed step ${index + 1}`,
    });
  }
};

export const navigateToTaskDetailPage = async ({
  page,
  world,
}: {
  page: Page;
  world: WebBddWorld;
}): Promise<void> => {
  if (!world.taskId) {
    throw new Error('taskId is required to open the task detail page');
  }

  await page.goto(`/tasks/${world.taskId}`);
  await page.waitForLoadState('domcontentloaded');
};

export const getTaskActionButton = ({
  page,
  action,
}: {
  page: Page;
  action: 'pause' | 'resume' | 'retry';
}): ReturnType<Page['getByTestId']> => {
  const testIdMap = {
    pause: TASK_PAUSE_BUTTON_TEST_ID,
    resume: TASK_RESUME_BUTTON_TEST_ID,
    retry: TASK_RETRY_BUTTON_TEST_ID,
  } as const;

  return page.getByTestId(testIdMap[action]);
};

export const expectTaskActionButtonVisibility = async ({
  page,
  action,
  isVisible,
}: {
  page: Page;
  action: 'pause' | 'resume' | 'retry';
  isVisible: boolean;
}): Promise<void> => {
  const button = getTaskActionButton({ page, action });
  if (isVisible) {
    await expect(button).toBeVisible({ timeout: TASK_ACTION_TIMEOUT_MS });
  } else {
    await expect(button).not.toBeVisible({ timeout: 5_000 });
  }
};

export const expectStatusBadgeText = async ({
  page,
  label,
}: {
  page: Page;
  label: string;
}): Promise<void> => {
  await expect(page.getByTestId(TASK_DETAIL_STATUS_TEST_ID)).toContainText(label, {
    timeout: TASK_ACTION_TIMEOUT_MS,
  });
};

export const waitForTaskStatusBadge = async ({
  page,
  statusLabel,
}: {
  page: Page;
  statusLabel: string;
}): Promise<void> => {
  await expect(async () => {
    await expectStatusBadgeText({ page, label: statusLabel });
  }).toPass({ timeout: TASK_ACTION_TIMEOUT_MS });
};

export const waitForTaskGraphqlPoll = async ({ page }: { page: Page }): Promise<void> => {
  await page.waitForTimeout(TASK_DETAIL_POLL_INTERVAL_MS + 500);
};

export const countGraphqlTaskPollRequests = async ({
  page,
  durationMs,
}: {
  page: Page;
  durationMs: number;
}): Promise<number> => {
  let requestCount = 0;

  const listener = (request: import('@playwright/test').Request): void => {
    const postData = request.postData();
    if (request.url().includes('/graphql') && postData?.includes('task(')) {
      requestCount += 1;
    }
  };

  page.on('request', listener);
  await page.waitForTimeout(durationMs);
  page.off('request', listener);

  return requestCount;
};

export const patchTaskAction = async ({
  world,
  api,
  action,
}: {
  world: WebBddWorld;
  api: import('@playwright/test').APIRequestContext;
  action: 'pause' | 'resume' | 'retry';
}): Promise<import('@playwright/test').APIResponse> => {
  if (!world.taskId) {
    throw new Error('taskId is required for task action API calls');
  }

  const apiBaseUrl = getE2eEnvironment().apiBaseUrl;
  const response = await api.fetch(`${apiBaseUrl}/tasks/${world.taskId}/${action}`, {
    method: 'PATCH',
    headers: world.auth?.token ? { Authorization: `Bearer ${world.auth.token}` } : undefined,
  });

  world.lastResponse = response;
  return response;
};

export const removePreferredAiCredential = async ({
  world,
  seed,
}: {
  world: WebBddWorld;
  seed: import('@vassembly/e2e').SeedContext;
}): Promise<void> => {
  if (!world.auth?.userId) {
    throw new Error('User must be logged in before removing AI credential');
  }

  await ensureTaskDomainIndexes({ context: seed });

  const aiDomain = requireWorkspaceModule<typeof import('@vassembly/domain-ai-integration')>({
    moduleName: '@vassembly/domain-ai-integration',
  });
  const credentials = await aiDomain.default.queries.getListForUser({
    userId: world.auth.userId,
    page: 1,
    size: 10,
    status: aiDomain.AI_INTEGRATION_LIST_ALL_STATUSES,
  });
  const credentialId = credentials.items[0]?.id;

  if (!credentialId) {
    throw new Error('No AI credential found to remove for credential-change scenario');
  }

  await aiDomain.default.commands.removeSoft({ id: credentialId, userId: world.auth.userId });
  world.integrationCredentialId = credentialId;
};

export const markTaskStatusInDatabase = async ({
  world,
  seed,
  status,
  llmResponse,
}: {
  world: WebBddWorld;
  seed: import('@vassembly/e2e').SeedContext;
  status: string;
  llmResponse?: string | null;
}): Promise<void> => {
  if (!world.taskId) {
    throw new Error('taskId is required to update task status in database');
  }

  await ensureTaskDomainIndexes({ context: seed });

  const { taskMongodbDao } = requireWorkspaceModule<typeof import('@vassembly/domain-task/src/clients')>({
    moduleName: '@vassembly/domain-task/src/clients',
  });
  const { ObjectId } = requireWorkspaceModule<typeof import('mongodb')>({
    moduleName: 'mongodb',
  });

  const updates: Record<string, unknown> = { status };
  if (llmResponse !== undefined) {
    updates.llmResponse = llmResponse;
  }

  await taskMongodbDao.collection.updateOne({ _id: new ObjectId(world.taskId) }, { $set: updates });
};

export interface TaskProgressPollingMonitor {
  stop: () => void;
  getRequestCount: () => number;
  getLatestResponseEventCount: () => number;
  getLatestEventTimestamp: () => string | null;
  getLatestEventId: () => string | null;
}

export const isTaskProgressGraphqlRequest = ({
  request,
  taskId,
}: {
  request: import('@playwright/test').Request;
  taskId?: string;
}): boolean => {
  const postData = request.postData();
  if (!request.url().includes('/graphql') || !postData?.includes('taskProgress')) {
    return false;
  }

  if (taskId && !postData.includes(taskId)) {
    return false;
  }

  return true;
};

export const createTaskProgressPollingMonitor = ({
  page,
  taskId,
}: {
  page: Page;
  taskId: string;
}): TaskProgressPollingMonitor => {
  let requestCount = 0;
  let latestResponseEventCount = 0;
  let latestEventTimestamp: string | null = null;
  let latestEventId: string | null = null;

  const listener = async (response: import('@playwright/test').Response): Promise<void> => {
    if (!response.url().includes('/graphql')) {
      return;
    }

    const request = response.request();
    if (!isTaskProgressGraphqlRequest({ request, taskId })) {
      return;
    }

    requestCount += 1;

    try {
      const json = (await response.json()) as {
        data?: { taskProgress?: { events?: Array<{ id?: string; timestamp?: string }> } };
      };
      const events = json.data?.taskProgress?.events ?? [];
      latestResponseEventCount = events.length;
      const lastEvent = events[events.length - 1];
      latestEventTimestamp = lastEvent?.timestamp ?? latestEventTimestamp;
      latestEventId = lastEvent?.id ?? latestEventId;
    } catch {
      // Response body may not be available for aborted requests.
    }
  };

  page.on('response', listener);

  return {
    stop: () => {
      page.off('response', listener);
    },
    getRequestCount: () => requestCount,
    getLatestResponseEventCount: () => latestResponseEventCount,
    getLatestEventTimestamp: () => latestEventTimestamp,
    getLatestEventId: () => latestEventId,
  };
};

export const countGraphqlTaskProgressPollRequests = async ({
  page,
  durationMs,
  taskId,
}: {
  page: Page;
  durationMs: number;
  taskId?: string;
}): Promise<number> => {
  let requestCount = 0;

  const listener = (request: import('@playwright/test').Request): void => {
    if (isTaskProgressGraphqlRequest({ request, taskId })) {
      requestCount += 1;
    }
  };

  page.on('request', listener);
  await page.waitForTimeout(durationMs);
  page.off('request', listener);

  return requestCount;
};

export const waitForProgressPollingToResume = async (
  page: Page,
  taskId: string,
  timeoutMs: number = 5_000,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const pollCount = await countGraphqlTaskProgressPollRequests({
      page,
      durationMs: 500,
      taskId,
    });

    if (pollCount > 0) {
      return true;
    }
  }

  return false;
};

export const assertProgressEventsAppearing = async (
  page: Page,
): Promise<boolean> => {
  const initialCount = await page.getByTestId(PROGRESS_ITEM_TEST_ID).count();

  await expect(async () => {
    const nextCount = await page.getByTestId(PROGRESS_ITEM_TEST_ID).count();
    expect(nextCount).toBeGreaterThan(initialCount);
  }).toPass({ timeout: 10_000 });

  return true;
};

export const getCurrentProgressAttempt = async (page: Page): Promise<number> => {
  const attemptText = await page.getByTestId(PROGRESS_EXECUTION_ATTEMPT_TEST_ID).textContent();
  const match = attemptText?.match(/(\d+)/);

  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10);
};

export const seedRunningTaskWithProgressEvents = async ({
  world,
  seed,
  eventCount = 2,
}: {
  world: WebBddWorld;
  seed: import('@vassembly/e2e').SeedContext;
  eventCount?: number;
}): Promise<void> => {
  await seedTaskWithStatus({ world, seed, status: 'in-progress' });
  await seedCompletedProgressEvents({ world, seed, eventCount });
};

export const finalizeTaskProgressForTask = async ({
  world,
}: {
  world: WebBddWorld;
}): Promise<void> => {
  if (!world.taskId) {
    throw new Error('taskId is required to finalize task progress');
  }

  const taskProgressDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-progress')>({
    moduleName: '@vassembly/domain-task-progress',
  });

  await taskProgressDomain.default.commands.finalizeTaskProgress({ taskId: world.taskId });
};

export const seedFailedTaskWithCompletedProgress = async ({
  world,
  seed,
}: {
  world: WebBddWorld;
  seed: import('@vassembly/e2e').SeedContext;
}): Promise<void> => {
  await seedTaskWithStatus({ world, seed, status: 'failed' });
  await seedCompletedProgressEvents({ world, seed, eventCount: 2 });
  await finalizeTaskProgressForTask({ world });
};

export const startBackgroundProgressEventWriter = ({
  world,
  seed,
  intervalMs = 2_000,
}: {
  world: WebBddWorld;
  seed: import('@vassembly/e2e').SeedContext;
  intervalMs?: number;
}): (() => void) => {
  const interval = setInterval(() => {
    void seedCompletedProgressEvents({ world, seed, eventCount: 1 }).catch(() => {
      clearInterval(interval);
    });
  }, intervalMs);

  return () => {
    clearInterval(interval);
  };
};

export const stopBackgroundProgressWriter = (world: WebBddWorld): void => {
  world.stopBackgroundProgressWriter?.();
  world.stopBackgroundProgressWriter = undefined;
};

export const stopTaskProgressPollingMonitor = (world: WebBddWorld): void => {
  world.stopTaskProgressPollingMonitor?.();
  world.stopTaskProgressPollingMonitor = undefined;
};

export const waitForActiveTaskProgressPolling = async ({
  page,
  taskId,
  timeoutMs = 10_000,
}: {
  page: Page;
  taskId: string;
  timeoutMs?: number;
}): Promise<void> => {
  await expect(async () => {
    const pollCount = await countGraphqlTaskProgressPollRequests({
      page,
      durationMs: TASK_PROGRESS_POLL_INTERVAL_MS + 500,
      taskId,
    });
    expect(pollCount).toBeGreaterThanOrEqual(1);
  }).toPass({ timeout: timeoutMs });
};
