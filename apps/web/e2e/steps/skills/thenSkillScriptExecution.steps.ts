import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import type { WebBddWorld } from '../utils/types';

const { Then } = createBdd(bddTest);

Then('skill-run-script handler should be registered', async ({ world }) => {
  const handlers = (
    world as WebBddWorld & { runtimeToolHandlers?: Record<string, unknown> }
  ).runtimeToolHandlers;

  if (!handlers || typeof handlers['skill-run-script'] !== 'function') {
    throw new Error('skill-run-script internal tool handler is not registered.');
  }
});
