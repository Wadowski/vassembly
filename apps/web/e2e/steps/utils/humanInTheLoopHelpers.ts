import { randomUUID } from 'node:crypto';

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { requireWorkspaceModule } from '@vassembly/e2e';

import {
  ensureAssistantSystemAgent,
  ensureTaskDomainIndexes,
} from './seedTask';
import { seedTaskWithStatus } from './pauseResumeRetryHelpers';
import type { WebBddWorld } from './types';

export const TASK_QUESTION_FORM_TEST_ID = 'task-question-form';
export const TASK_QUESTION_TEXT_TEST_ID = 'task-question-text';
export const TASK_QUESTION_PROGRESS_TEST_ID = 'task-question-progress';
export const TASK_QUESTION_TEXT_INPUT_TEST_ID = 'task-question-text-input';
export const TASK_QUESTION_SUBMIT_TEST_ID = 'task-question-submit';
export const TASK_QUESTION_PREVIOUS_TEST_ID = 'task-question-previous';
export const TASK_QUESTION_NEXT_TEST_ID = 'task-question-next';
export const TASK_QUESTION_BOOLEAN_INPUT_TEST_ID = 'task-question-boolean-input';
export const TASK_QUESTIONS_HISTORY_TEST_ID = 'task-questions-history';
export const TASK_QUESTION_HISTORY_ITEM_TEST_ID = 'task-question-history-item';
export const TASK_QUESTION_HISTORY_ANSWER_TEST_ID = 'task-question-history-answer';

export const TASK_QUESTIONS_POLL_INTERVAL_MS = 2_000;
export const TASK_WAITING_NOTIFICATION_MESSAGE =
  'The assistant needs your input to continue.';

export interface PendingQuestionSeedRow {
  question: string;
  inputType?: string;
  options?: string[];
  questionId?: string;
}

export interface SeedWaitingTaskWithQuestionsParams {
  world: WebBddWorld;
  seed: import('@vassembly/e2e').SeedContext;
  questions: PendingQuestionSeedRow[];
}

let taskQuestionsDomainInitPromise: Promise<void> | null = null;

export const ensureTaskQuestionsDomainIndexes = async ({
  context,
}: {
  context: import('@vassembly/e2e').SeedContext;
}): Promise<void> => {
  if (taskQuestionsDomainInitPromise === null) {
    taskQuestionsDomainInitPromise = initializeTaskQuestionsDomain({ context });
  }

  await taskQuestionsDomainInitPromise;
};

const initializeTaskQuestionsDomain = async ({
  context,
}: {
  context: import('@vassembly/e2e').SeedContext;
}): Promise<void> => {
  await ensureTaskDomainIndexes({ context });

  const { init } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });
  const taskQuestionsDomain = requireWorkspaceModule<
    typeof import('@vassembly/domain-task-questions')
  >({
    moduleName: '@vassembly/domain-task-questions',
  });

  await init({
    indexFunctions: [taskQuestionsDomain.default.mongodbIndexes],
  });
};

export const storePendingQuestionsInWorld = ({
  world,
  pendingQuestions,
}: {
  world: WebBddWorld;
  pendingQuestions: Array<{ questionId: string; question: string }>;
}): void => {
  world.pendingQuestionIds = pendingQuestions.map((question) => question.questionId);
  world.questionsByText = Object.fromEntries(
    pendingQuestions.map((question) => [question.question, question.questionId]),
  );
};

export const seedWaitingTaskWithQuestions = async ({
  world,
  seed,
  questions,
}: SeedWaitingTaskWithQuestionsParams): Promise<void> => {
  if (!world.auth?.userId) {
    throw new Error('User must be logged in before seeding a waiting task');
  }

  if (questions.length === 0) {
    throw new Error('At least one pending question is required');
  }

  await seedTaskWithStatus({ world, seed, status: 'in-progress' });
  await ensureTaskQuestionsDomainIndexes({ context: seed });

  const assistantId = await ensureAssistantSystemAgent({ context: seed });
  const taskQuestionsDomain = requireWorkspaceModule<
    typeof import('@vassembly/domain-task-questions')
  >({
    moduleName: '@vassembly/domain-task-questions',
  });
  const taskDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task')>({
    moduleName: '@vassembly/domain-task',
  });

  if (!world.taskId) {
    throw new Error('taskId is required after seeding task');
  }

  const recordResult = await taskQuestionsDomain.default.commands.recordQuestions({
    taskId: world.taskId,
    invocationId: randomUUID(),
    askedByAgentId: assistantId,
    askedByAgentType: 'system',
    questions: questions.map((row) => ({
      question: row.question,
      inputType: (row.inputType ?? 'text') as 'text' | 'select' | 'multiselect' | 'boolean',
      options: row.options,
      questionId: row.questionId,
    })),
  });

  await taskDomain.default.commands.markWaiting({ taskId: world.taskId });

  const pendingQuestions = recordResult.data.pendingQuestions ?? [];
  storePendingQuestionsInWorld({ world, pendingQuestions });
};

export const transitionTaskToWaitingWithQuestions = async ({
  world,
  seed,
  questions,
}: SeedWaitingTaskWithQuestionsParams): Promise<void> => {
  if (!world.taskId) {
    throw new Error('taskId is required to transition task to waiting');
  }

  await ensureTaskQuestionsDomainIndexes({ context: seed });

  const assistantId = await ensureAssistantSystemAgent({ context: seed });
  const taskQuestionsDomain = requireWorkspaceModule<
    typeof import('@vassembly/domain-task-questions')
  >({
    moduleName: '@vassembly/domain-task-questions',
  });
  const taskDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task')>({
    moduleName: '@vassembly/domain-task',
  });

  const recordResult = await taskQuestionsDomain.default.commands.recordQuestions({
    taskId: world.taskId,
    invocationId: randomUUID(),
    askedByAgentId: assistantId,
    askedByAgentType: 'system',
    questions: questions.map((row) => ({
      question: row.question,
      inputType: (row.inputType ?? 'text') as 'text' | 'select' | 'multiselect' | 'boolean',
      options: row.options,
      questionId: row.questionId,
    })),
  });

  await taskDomain.default.commands.markWaiting({ taskId: world.taskId });

  const pendingQuestions = recordResult.data.pendingQuestions ?? [];
  storePendingQuestionsInWorld({ world, pendingQuestions });
};

export const parsePendingQuestionTable = (
  table: { rows: () => string[][] },
): PendingQuestionSeedRow[] => {
  const rows = table.rows();
  const header = rows[0] ?? [];
  const questionIndex = header.indexOf('question');
  const inputTypeIndex = header.indexOf('inputType');
  const optionsIndex = header.indexOf('options');

  if (questionIndex === -1) {
    throw new Error('Pending questions table must include a question column');
  }

  return rows.slice(1).map((row) => {
    const question = row[questionIndex];
    if (!question) {
      throw new Error('Pending question row is missing question text');
    }

    const inputType = inputTypeIndex >= 0 ? row[inputTypeIndex] : undefined;
    const optionsRaw = optionsIndex >= 0 ? row[optionsIndex] : undefined;
    const options =
      optionsRaw && optionsRaw.trim() !== ''
        ? optionsRaw.split(',').map((option) => option.trim())
        : undefined;

    return {
      question,
      inputType: inputType && inputType.trim() !== '' ? inputType : undefined,
      options,
    };
  });
};

export const navigateToQuestionByText = async ({
  page,
  questionText,
}: {
  page: Page;
  questionText: string;
}): Promise<void> => {
  const questionLocator = page.getByTestId(TASK_QUESTION_TEXT_TEST_ID);
  const nextButton = page.getByTestId(TASK_QUESTION_NEXT_TEST_ID);
  const totalQuestions = await page.getByTestId(TASK_QUESTION_PROGRESS_TEST_ID).textContent();
  const match = totalQuestions?.match(/of (\d+)/);
  const total = match ? Number.parseInt(match[1], 10) : 1;

  for (let attempt = 0; attempt < total; attempt += 1) {
    const currentText = await questionLocator.textContent();
    if (currentText?.includes(questionText)) {
      return;
    }

    await nextButton.click();
  }

  throw new Error(`Could not navigate to question: ${questionText}`);
};

export const countGraphqlTaskQuestionsPollRequests = async ({
  page,
  durationMs,
}: {
  page: Page;
  durationMs: number;
}): Promise<number> => {
  let requestCount = 0;

  const listener = (request: import('@playwright/test').Request): void => {
    const postData = request.postData();
    if (request.url().includes('/graphql') && postData?.includes('taskQuestions')) {
      requestCount += 1;
    }
  };

  page.on('request', listener);
  await page.waitForTimeout(durationMs);
  page.off('request', listener);

  return requestCount;
};

export const expectTaskQuestionFormVisibility = async ({
  page,
  isVisible,
}: {
  page: Page;
  isVisible: boolean;
}): Promise<void> => {
  const form = page.getByTestId(TASK_QUESTION_FORM_TEST_ID);
  if (isVisible) {
    await expect(form).toBeVisible({ timeout: 15_000 });
  } else {
    await expect(form).not.toBeVisible({ timeout: 15_000 });
  }
};

export const expectWaitingNotification = async ({ page }: { page: Page }): Promise<void> => {
  await expect(page.getByText(TASK_WAITING_NOTIFICATION_MESSAGE)).toBeVisible({
    timeout: 15_000,
  });
};
