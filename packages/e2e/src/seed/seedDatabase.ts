import { MongoClient } from 'mongodb';

import { InternalError } from '@vassembly/errors';

import { applySeedContext } from './applySeedContext';
import type { SeedDatabaseParams, TeardownDatabaseParams } from './types';

export const seedDatabase = async ({ context }: SeedDatabaseParams): Promise<void> => {
  applySeedContext({ context });

  const client = new MongoClient(context.mongoUrl);
  await client.connect();

  try {
    await client.db(context.mongoDatabase).dropDatabase();
  } finally {
    await client.close();
  }

  const { init } = await import('@vassembly/client-mongodb');
  const userDomain = await import('@vassembly/domain-user');
  await init({ indexFunctions: [userDomain.default.mongodbIndexes] });
};

export const teardownDatabase = async ({ context }: TeardownDatabaseParams): Promise<void> => {
  applySeedContext({ context });

  const { mongoDb } = await import('@vassembly/client-mongodb');

  try {
    await mongoDb.client.close();
  } catch (error) {
    throw new InternalError('Failed to disconnect from MongoDB during teardown', error);
  }
};
