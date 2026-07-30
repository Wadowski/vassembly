import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  applyClassifierOutputLinesToComment,
  attachPlanToComment,
  runCommentClassification,
  seedTaskCommentAwaitingClassification,
} from '../utils/seedMultiSpecTask';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

When('the Specialization Classifier processes my comment', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId || !webWorld.taskId || !webWorld.commentId) {
    throw new Error('taskId and commentId are required before running classification');
  }

  const result = await runCommentClassification({
    context: seed,
    userId: webWorld.auth.userId,
    taskId: webWorld.taskId,
    commentId: webWorld.commentId,
  });

  webWorld.classifierInputMessage = result.classifierInputMessage;
});

When(
  'the Specialization Classifier returns output containing a {string} line and a {string} line',
  async ({ seed, world }, existingLine: string, newLine: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId || !webWorld.taskId || !webWorld.commentId) {
      throw new Error('taskId and commentId are required before applying classifier output');
    }

    await applyClassifierOutputLinesToComment({
      context: seed,
      userId: webWorld.auth.userId,
      taskId: webWorld.taskId,
      commentId: webWorld.commentId,
      outputLines: [existingLine, newLine],
    });
  },
);

When('the Specialization Classifier processes a comment mentioning {string}', async ({ seed, world }, phrase: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before running classification');
  }

  if (!webWorld.commentId || !webWorld.taskId) {
    const seeded = await seedTaskCommentAwaitingClassification({
      context: seed,
      userId: webWorld.auth.userId,
      userText: `Please organize work in ${phrase}`,
    });
    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;
  }

  const result = await runCommentClassification({
    context: seed,
    userId: webWorld.auth!.userId,
    taskId: webWorld.taskId!,
    commentId: webWorld.commentId!,
  });

  webWorld.classifierInputMessage = result.classifierInputMessage;
});

When('the Specialization Classifier returns {int} valid specialization lines\\/NEW entries', async ({ seed, world }, count: number) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId || !webWorld.taskId || !webWorld.commentId) {
    throw new Error('taskId and commentId are required before applying classifier output');
  }

  const lines = ['legal', 'finance', 'engineering', 'marketing', 'operations'].slice(0, count);

  await applyClassifierOutputLinesToComment({
    context: seed,
    userId: webWorld.auth.userId,
    taskId: webWorld.taskId,
    commentId: webWorld.commentId,
    outputLines: lines,
  });
});

When(
  "normalizeGeneratedSpecializations processes the output for my comment",
  async ({ seed, world }) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId || !webWorld.taskId || !webWorld.commentId) {
      throw new Error('taskId and commentId are required before applying classifier output');
    }

    const lines = [
      'legal',
      'finance',
      'engineering',
      'marketing',
      'operations',
      'design',
    ];

    await applyClassifierOutputLinesToComment({
      context: seed,
      userId: webWorld.auth.userId,
      taskId: webWorld.taskId,
      commentId: webWorld.commentId,
      outputLines: lines,
    });
  },
);

When('the Specialization Classifier processes the comment', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId || !webWorld.taskId || !webWorld.commentId) {
    throw new Error('taskId and commentId are required before running classification');
  }

  await runCommentClassification({
    context: seed,
    userId: webWorld.auth.userId,
    taskId: webWorld.taskId,
    commentId: webWorld.commentId,
  });
});

When('the Task Planner composes the plan', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId || !webWorld.commentId || !webWorld.taskId) {
    throw new Error('taskId and commentId are required before composing a plan');
  }

  const planItems = webWorld.planWorkerItems ?? [];
  if (planItems.length === 0) {
    throw new Error('planWorkerItems must be seeded before composing a plan');
  }

  webWorld.taskPlanInstanceId = await attachPlanToComment({
    context: seed,
    taskId: webWorld.taskId,
    commentId: webWorld.commentId,
    shortName: 'multi-spec-cross-domain',
    items: planItems.map((item) => ({
      order: item.order,
      agentName: item.agentName,
      description: item.description,
      status: 'pending',
    })),
  });

  webWorld.planItemDescriptions = planItems.map((item) => item.description);
});

When('classification completes and I view the task detail activity feed', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.taskId) {
    return;
  }

  await page.goto(`/tasks/${webWorld.taskId}`);
  await page.getByTestId('task-detail-title').waitFor({ state: 'visible', timeout: 15_000 });
});

When('the invocation completes', async () => {
  // Progress events are seeded directly in Given steps for AF-2.
});

When('the Specialization Classifier tool handler returns a {string} result', async () => {
  // Skipped classification is represented by seeded progress events in Given steps for AF-3.
});

When('I view the classifier entry in the activity feed', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.taskId) {
    return;
  }

  await page.goto(`/tasks/${webWorld.taskId}`);
  await page.getByTestId('task-detail-title').waitFor({ state: 'visible', timeout: 15_000 });
});

When('I view the activity feed for that comment turn', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.taskId) {
    return;
  }

  await page.goto(`/tasks/${webWorld.taskId}`);
  await page.getByTestId('task-detail-title').waitFor({ state: 'visible', timeout: 15_000 });
});
