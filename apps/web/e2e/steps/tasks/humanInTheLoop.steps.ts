import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  countGraphqlTaskPollRequests,
  countGraphqlTaskQuestionsPollRequests,
  TASK_ACTION_TIMEOUT_MS,
  TASK_DETAIL_POLL_INTERVAL_MS,
} from '../utils/pauseResumeRetryHelpers';
import {
  expectTaskQuestionFormVisibility,
  expectWaitingNotification,
  navigateToQuestionByText,
  parsePendingQuestionTable,
  seedWaitingTaskWithQuestions,
  TASK_QUESTION_BOOLEAN_INPUT_TEST_ID,
  TASK_QUESTION_HISTORY_ITEM_TEST_ID,
  TASK_QUESTION_NEXT_TEST_ID,
  TASK_QUESTION_PREVIOUS_TEST_ID,
  TASK_QUESTION_PROGRESS_TEST_ID,
  TASK_QUESTION_SUBMIT_TEST_ID,
  TASK_QUESTION_TEXT_INPUT_TEST_ID,
  TASK_QUESTION_TEXT_TEST_ID,
  TASK_QUESTIONS_HISTORY_TEST_ID,
  TASK_QUESTIONS_POLL_INTERVAL_MS,
  transitionTaskToWaitingWithQuestions,
} from '../utils/humanInTheLoopHelpers';
import type { WebBddWorld } from '../utils/types';

const { Given, When, Then } = createBdd(bddTest);

const getWebWorld = (world: WebBddWorld): WebBddWorld => world;

Given('a task is waiting with pending questions:', async ({ seed, world }, table) => {
  const questions = parsePendingQuestionTable(table);
  await seedWaitingTaskWithQuestions({ world: getWebWorld(world), seed, questions });
});

When('the task enters waiting state with pending questions:', async ({ seed, world }, table) => {
  const questions = parsePendingQuestionTable(table);
  await transitionTaskToWaitingWithQuestions({ world: getWebWorld(world), seed, questions });
});

Then('I see the task question form', async ({ page }) => {
  if (!page) {
    return;
  }

  await expectTaskQuestionFormVisibility({ page, isVisible: true });
});

Then('the task question form is not visible', async ({ page }) => {
  if (!page) {
    return;
  }

  await expectTaskQuestionFormVisibility({ page, isVisible: false });
});

Then('the task question progress shows {string}', async ({ page }, progressLabel: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId(TASK_QUESTION_PROGRESS_TEST_ID)).toContainText(progressLabel);
});

Then('I see the task question text {string}', async ({ page }, questionText: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId(TASK_QUESTION_TEXT_TEST_ID)).toContainText(questionText);
});

When('I fill in the task question answer {string}', async ({ page }, answer: string) => {
  if (!page) {
    return;
  }

  await page.getByTestId(TASK_QUESTION_TEXT_INPUT_TEST_ID).fill(answer);
});

When('I select the boolean task question answer {string}', async ({ page }, answer: string) => {
  if (!page) {
    return;
  }

  const booleanGroup = page.getByTestId(TASK_QUESTION_BOOLEAN_INPUT_TEST_ID);
  await booleanGroup.getByRole('button', { name: answer, exact: true }).click();
});

When('I click the task question submit button', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const webWorld = getWebWorld(world);
  const currentQuestionText = (await page.getByTestId(TASK_QUESTION_TEXT_TEST_ID).textContent())?.trim();
  const questionId =
    (currentQuestionText ? webWorld.questionsByText?.[currentQuestionText] : undefined) ??
    webWorld.pendingQuestionIds?.[0];

  if (!webWorld.taskId || !questionId) {
    throw new Error('taskId and questionId are required to submit an answer');
  }

  const submitResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/tasks/${webWorld.taskId}/questions/${questionId}/answer`) &&
      response.request().method() === 'PATCH',
    { timeout: TASK_ACTION_TIMEOUT_MS },
  );

  await page.getByTestId(TASK_QUESTION_SUBMIT_TEST_ID).click();
  webWorld.lastResponse = await submitResponse;
  webWorld.lastSubmittedQuestionId = questionId;

  if (currentQuestionText && webWorld.questionsByText) {
    delete webWorld.questionsByText[currentQuestionText];
  }
  webWorld.pendingQuestionIds = webWorld.pendingQuestionIds?.filter((id) => id !== questionId);
});

When(
  'I answer the task question {string} with {string}',
  async ({ page, world }, questionText: string, answer: string) => {
    if (!page) {
      return;
    }

    const webWorld = getWebWorld(world);
    const questionId = webWorld.questionsByText?.[questionText];

    if (!webWorld.taskId || !questionId) {
      throw new Error(`Unknown question "${questionText}" for task ${webWorld.taskId ?? 'unknown'}`);
    }

    await navigateToQuestionByText({ page, questionText });
    await page.getByTestId(TASK_QUESTION_TEXT_INPUT_TEST_ID).fill(answer);

    const submitResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/tasks/${webWorld.taskId}/questions/${questionId}/answer`) &&
        response.request().method() === 'PATCH',
      { timeout: TASK_ACTION_TIMEOUT_MS },
    );

    await page.getByTestId(TASK_QUESTION_SUBMIT_TEST_ID).click();
    await submitResponse;

    delete webWorld.questionsByText?.[questionText];
    webWorld.pendingQuestionIds = webWorld.pendingQuestionIds?.filter((id) => id !== questionId);
  },
);

When('I click the task question next button', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.getByTestId(TASK_QUESTION_NEXT_TEST_ID).click();
});

When('I click the task question previous button', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.getByTestId(TASK_QUESTION_PREVIOUS_TEST_ID).click();
});

Then('the submit answer API request is sent successfully', async ({ world }) => {
  const response = getWebWorld(world).lastResponse;
  expect(response).toBeDefined();
  expect(response?.ok()).toBe(true);
});

Then(
  'I see the answered question {string} in the history',
  async ({ page },
  questionText: string,
) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId(TASK_QUESTIONS_HISTORY_TEST_ID)).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByTestId(TASK_QUESTION_HISTORY_ITEM_TEST_ID).filter({ hasText: questionText }),
  ).toBeVisible();
});

Then('I see {int} answered questions in the history', async ({ page }, count: number) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId(TASK_QUESTION_HISTORY_ITEM_TEST_ID)).toHaveCount(count, {
    timeout: 15_000,
  });
});

Then('task detail polling continues while waiting', async ({ page }) => {
  if (!page) {
    return;
  }

  const pollCount = await countGraphqlTaskPollRequests({
    page,
    durationMs: TASK_DETAIL_POLL_INTERVAL_MS + 500,
  });

  expect(pollCount).toBeGreaterThanOrEqual(1);
});

Then('task questions polling is active', async ({ page }) => {
  if (!page) {
    return;
  }

  const pollCount = await countGraphqlTaskQuestionsPollRequests({
    page,
    durationMs: TASK_QUESTIONS_POLL_INTERVAL_MS + 500,
  });

  expect(pollCount).toBeGreaterThanOrEqual(1);
});

Then('I see the waiting for input notification', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(async () => {
    await expectWaitingNotification({ page });
  }).toPass({ timeout: TASK_ACTION_TIMEOUT_MS });
});
