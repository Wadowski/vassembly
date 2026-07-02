import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { assignInternalToolsToSystemAgent, seedRuntimeSystemAgent } from '../utils/skillRuntimeHelpers';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

Given(
  'system agent {string} is seeded with skill-run-script assigned',
  async ({ seed, world }, agentName: string) => {
    const agentId = await seedRuntimeSystemAgent({
      context: seed,
      name: agentName,
      assignedToolIds: ['skill-run-script'],
    });

    world.runtimeCallerAgentId = agentId;
  },
);

Given(
  'system agent {string} has skill-run-script assigned',
  async ({ seed, world }, agentName: string) => {
    const agentId = world.runtimeCallerAgentId;
    if (!agentId) {
      throw new Error('runtimeCallerAgentId is not set on world');
    }

    await assignInternalToolsToSystemAgent({
      context: seed,
      systemAgentId: agentId,
      assignedToolIds: ['skill-run-script'],
    });

    void agentName;
  },
);
