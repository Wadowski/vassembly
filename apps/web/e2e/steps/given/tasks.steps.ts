import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  ensureAssistantSystemAgent,
  seedAiCredentialForUser,
  upsertSystemAgentPreference,
} from '../utils/seedTask';
import { seedTaskForUser } from '../utils/seedTaskData';
import { refreshHomeTaskListIfNeeded } from '../utils/refreshHomeTaskList';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

Given('a system agent preference is configured', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before configuring system agent preference');
  }

  const credentialId = await seedAiCredentialForUser({ context: seed, userId: webWorld.auth.userId });
  await upsertSystemAgentPreference({
    context: seed,
    userId: webWorld.auth.userId,
    integrationCredentialId: credentialId,
  });
  await ensureAssistantSystemAgent({ context: seed });
});

Given('the user has {int} recent tasks matching {string}', async ({ seed, world }, count: number, query: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding tasks');
  }

  for (let index = 0; index < count; index += 1) {
    const title = `${query} task ${index + 1}`;
    await seedTaskForUser({
      context: seed,
      userId: webWorld.auth.userId,
      description: `Description for ${title}`,
      title,
    });
  }

  await refreshHomeTaskListIfNeeded({ page: world.page });
});

Given('the user has {int} recent tasks', async ({ seed, world }, count: number) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding tasks');
  }

  for (let index = 0; index < count; index += 1) {
    await seedTaskForUser({
      context: seed,
      userId: webWorld.auth.userId,
      description: `E2E task ${index + 1}`,
      title: `Task ${index + 1}`,
    });
  }

  await refreshHomeTaskListIfNeeded({ page: world.page });
});

Given('the user has tasks with titles:', async ({ seed, world }, table) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding tasks');
  }

  const rows = table.rows();
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const title = rows[rowIndex]?.[0];
    if (!title) {
      continue;
    }

    await seedTaskForUser({
      context: seed,
      userId: webWorld.auth.userId,
      description: `Description for ${title}`,
      title,
    });
  }

  await refreshHomeTaskListIfNeeded({ page: world.page });
});

Given('a task {string} exists', async ({ seed, world }, description: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description,
  });
});

Given('a task with ID {string} exists', async ({ seed, world }, taskId: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a task');
  }

  webWorld.taskId = await seedTaskForUser({
    context: seed,
    userId: webWorld.auth.userId,
    description: `Task for ${taskId}`,
    title: taskId,
  });
  webWorld.storedFields = { ...(webWorld.storedFields ?? {}), taskId: webWorld.taskId };
});
