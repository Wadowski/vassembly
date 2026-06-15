import { init as initMongoDb } from '@vassembly/client-mongodb';
import systemAgentDomain from '@vassembly/domain-system-agent';

import { applySeedContext } from './applySeedContext';

import type { SeedContext } from '../fixtures/types';

export interface SeedE2ESystemAgentsParams {
  context: SeedContext;
}

export const seedE2ESystemAgents = async ({ context }: SeedE2ESystemAgentsParams): Promise<void> => {
  applySeedContext({ context });

  await initMongoDb({ indexFunctions: [systemAgentDomain.mongodbIndexes] });
  await systemAgentDomain.seedSystemAgents();
};
