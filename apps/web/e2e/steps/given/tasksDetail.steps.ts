import { createBdd } from 'playwright-bdd';

import { bddTest, seedUser } from '@vassembly/e2e';

import { seedTaskForUser } from '../utils/seedTaskData';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const E2E_USER_PASSWORD = 'SecurePass123!';

Given('a task is completed with title {string}', async ({ seed, world }, title: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: `Completed task: ${title}`,
    title,
    status: 'done',
  });
});

Given('a task is in-progress with no title yet', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: 'In-progress task without title',
    title: null,
    status: 'in-progress',
  });
});

Given('a task without an assigned agent exists', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: 'Task without assigned agent',
    agentAssignedId: null,
  });
});

Given('a task with an empty description exists', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: 'Temporary description for empty description test',
    title: 'Empty description task',
    clearDescription: true,
  });
});

Given('a completed task with output {string}', async ({ seed, world }, output: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: 'Completed task with output',
    title: 'Completed output task',
    status: 'done',
    llmResponse: output,
  });
});

Given('a failed task with error message {string}', async ({ seed, world }, errorMessage: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: 'Failed task',
    status: 'failed',
    errorMessage,
    errorCode: 'E2E_FAILED',
  });
});

Given('another user {string} exists with tasks', async ({ seed, world }, email: string) => {
  const webWorld = world as WebBddWorld;
  const otherUser = await seedUser({ email, password: E2E_USER_PASSWORD, context: seed });
  webWorld.otherUserId = otherUser.id;

  await seedTaskForUser({
    context: seed,
    userId: otherUser.id,
    description: 'Other user task',
    title: 'Other user task',
  });
});

Given('another user {string} has a task', async ({ seed, world }, email: string) => {
  const webWorld = world as WebBddWorld;
  const otherUser = await seedUser({ email, password: E2E_USER_PASSWORD, context: seed });
  webWorld.otherUserId = otherUser.id;
  webWorld.otherUserTaskId = await seedTaskForUser({
    context: seed,
    userId: otherUser.id,
    description: 'Private other user task',
    title: 'Private task',
  });
});

Given('a task exists for the detail page', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: 'Default detail page task',
  });
});

Given('I navigate to a task detail page', async ({ page, seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page) {
    return;
  }

  if (!webWorld.taskId) {
    if (!webWorld.auth?.userId) {
      throw new Error('taskId or logged-in user is required');
    }
    webWorld.taskId = await seedTaskForUser({
      context: seed,
      userId: webWorld.auth.userId,
      description: 'Default detail page task',
    });
  }

  await page.goto(`/tasks/${webWorld.taskId}`);
});

Given('I navigate to an in-progress task detail page', async ({ page, seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: 'In-progress polling task',
    status: 'in-progress',
  });

  if (page) {
    await page.goto(`/tasks/${webWorld.taskId}`);
  }
});
