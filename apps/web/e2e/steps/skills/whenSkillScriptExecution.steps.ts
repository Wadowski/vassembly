import { createBdd } from 'playwright-bdd';

import { bddTest, requireWorkspaceModule } from '@vassembly/e2e';

import { ensureDomainInfrastructure } from '../utils/initDomainContext';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

When('internal tool handlers are created for a task context', async ({ seed, world }) => {
  await ensureDomainInfrastructure({ context: seed });

  const { createInternalToolHandlers } = requireWorkspaceModule<
    typeof import('@vassembly/service-agent/src/internalTools/createInternalToolHandlers.ts')
  >({
    moduleName: '@vassembly/service-agent/src/internalTools/createInternalToolHandlers.ts',
  });

  const callerAgentId = world.runtimeCallerAgentId;
  if (!callerAgentId) {
    throw new Error('runtimeCallerAgentId is not set on world');
  }

  const handlers = createInternalToolHandlers({
    toolContext: {
      userId: 'e2e-runtime-user',
      taskId: 'e2e-runtime-task',
      invocationId: 'e2e-runtime-invocation',
      callerAgentId,
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: 'e2e-runtime-root',
    },
  });

  (world as WebBddWorld & { runtimeToolHandlers?: Record<string, unknown> }).runtimeToolHandlers =
    handlers;
});
