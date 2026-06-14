import { randomUUID } from 'node:crypto';

import { createBdd } from 'playwright-bdd';

import { bddTest, seedUser } from '@vassembly/e2e';

import { seedConnectedAiCredentialForUser } from '../utils/seedConnectedAiCredential';
import { seedAgent, softDeleteAgent } from '../utils/seedAgent';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const E2E_USER_PASSWORD = 'SecurePass123!';

Given('an agent exists for the current user with name {string}', async ({ seed, world }, name: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('Current user must be logged in before seeding an agent');
  }

  webWorld.agentId = await seedAgent({
    context: seed,
    userId: webWorld.auth.userId,
    name,
    integrationCredentialId: webWorld.integrationCredentialId,
  });
});

Given(
  'an agent exists for the current user with name {string} with description {string} and instructions {string}',
  async ({ seed, world }, name: string, description: string, instructions: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('Current user must be logged in before seeding an agent');
    }

    webWorld.agentId = await seedAgent({
      context: seed,
      userId: webWorld.auth.userId,
      name,
      description,
      rule: instructions,
      integrationCredentialId: webWorld.integrationCredentialId,
    });
  },
);

Given('an agent exists for the current user', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('Current user must be logged in before seeding an agent');
  }

  webWorld.agentId = await seedAgent({
    context: seed,
    userId: webWorld.auth.userId,
    name: 'E2E Agent',
    integrationCredentialId: webWorld.integrationCredentialId,
  });
});

Given('a connected AI integration exists for the current user', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('Current user must be logged in before seeding an AI integration');
  }

  webWorld.integrationCredentialId = await seedConnectedAiCredentialForUser({
    context: seed,
    userId: webWorld.auth.userId,
  });
});

Given('an agent exists for another user with name {string}', async ({ seed, world }, name: string) => {
  const webWorld = world as WebBddWorld;
  const otherUserEmail = `e2e-other-${randomUUID()}@vassembly.test`;
  const otherUser = await seedUser({
    email: otherUserEmail,
    password: E2E_USER_PASSWORD,
    context: seed,
  });

  webWorld.otherUserId = otherUser.id;
  webWorld.agentId = await seedAgent({
    context: seed,
    userId: otherUser.id,
    name,
  });
});

Given('an agent exists for another user', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  const otherUserEmail = `e2e-other-${randomUUID()}@vassembly.test`;
  const otherUser = await seedUser({
    email: otherUserEmail,
    password: E2E_USER_PASSWORD,
    context: seed,
  });

  webWorld.otherUserId = otherUser.id;
  webWorld.agentId = await seedAgent({
    context: seed,
    userId: otherUser.id,
    name: 'Other User Agent',
  });
});

Given('the agent is deleted', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.agentId || !webWorld.auth?.userId) {
    throw new Error('agentId and authenticated user are required to delete an agent');
  }

  await softDeleteAgent({
    context: seed,
    agentId: webWorld.agentId,
    userId: webWorld.auth.userId,
  });
});

Given('the agents list fetch fails', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.unroute('**/graphql**').catch(() => undefined);
  await page.route('**/graphql**', (route) => {
    if (route.request().postData()?.includes('ListAgents')) {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });
});
