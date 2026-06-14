import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { seedAgent } from '../utils/seedAgent';
import { getMcpIdBySlug, seedMcpCatalog } from '../utils/seedMcp';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

Given(
  'an agent exists for the current user with name {string} assigned to MCP slug {string}',
  async ({ seed, world }, agentName: string, slug: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('Current user must be logged in before seeding an agent with MCP assignment');
    }

    await seedMcpCatalog({ context: seed });
    const mcpId = await getMcpIdBySlug({ context: seed, slug });

    webWorld.agentId = await seedAgent({
      context: seed,
      userId: webWorld.auth.userId,
      name: agentName,
      integrationCredentialId: webWorld.integrationCredentialId,
      assignedMcpIds: [mcpId],
    });
    webWorld.mcpId = mcpId;
  },
);
