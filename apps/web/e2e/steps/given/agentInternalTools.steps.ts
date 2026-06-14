import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { seedAgent } from '../utils/seedAgent';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

Given(
  'an agent exists for the current user with name {string} assigned to internal tool id {string}',
  async ({ seed, world }, agentName: string, toolId: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('Current user must be logged in before seeding an agent with internal tool assignment');
    }

    webWorld.agentId = await seedAgent({
      context: seed,
      userId: webWorld.auth.userId,
      name: agentName,
      integrationCredentialId: webWorld.integrationCredentialId,
      assignedToolIds: [toolId],
    });
  },
);

Given(
  'an agent exists for the current user with name {string} assigned to internal tool ids {string} and {string}',
  async ({ seed, world }, agentName: string, firstToolId: string, secondToolId: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('Current user must be logged in before seeding an agent with internal tool assignment');
    }

    webWorld.agentId = await seedAgent({
      context: seed,
      userId: webWorld.auth.userId,
      name: agentName,
      integrationCredentialId: webWorld.integrationCredentialId,
      assignedToolIds: [firstToolId, secondToolId],
    });
  },
);
