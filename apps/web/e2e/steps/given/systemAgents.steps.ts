import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { getSystemAgentIdByName } from '../utils/seedSystemAgent';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

Given('the system agent {string} is available for editing', async ({ seed, world }, name: string) => {
  const webWorld = world as WebBddWorld;
  webWorld.systemAgentId = await getSystemAgentIdByName({ context: seed, name });
});
