import { MongoClient } from 'mongodb';

import { InternalError } from '@vassembly/errors';

import { requireWorkspaceModule } from '../utils/requireWorkspaceModule';
import { applySeedContext } from './applySeedContext';
import type { SeedDatabaseParams, TeardownDatabaseParams } from './types';

export const dropDatabase = async ({ context }: SeedDatabaseParams): Promise<void> => {
  applySeedContext({ context });

  const client = new MongoClient(context.mongoUrl);
  await client.connect();

  try {
    await client.db(context.mongoDatabase).dropDatabase();
  } finally {
    await client.close();
  }
};

export const seedDatabase = dropDatabase;

export const cleanupDatabase = dropDatabase;

export const teardownDatabase = async ({ context }: TeardownDatabaseParams): Promise<void> => {
  applySeedContext({ context });

  const { mongoDb } = requireWorkspaceModule<
    typeof import('@vassembly/client-mongodb')
  >({
    moduleName: '@vassembly/client-mongodb',
  });

  try {
    await mongoDb.client.close();
  } catch (error) {
    throw new InternalError('Failed to disconnect from MongoDB during teardown', error);
  }
};
