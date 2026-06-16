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
export const TASK_ACTION_TIMEOUT_MS = 60_000;

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
