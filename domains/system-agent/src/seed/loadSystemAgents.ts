import { systemAgentMongodbDao } from '../clients';
import { SYSTEM_AGENT_DEFAULT_STATUS } from '../constants';
import { invalidateActiveByNameCache } from '../cache/keys';
import { systemAgentFactory } from '../model';
import { ACTIVE_SYSTEM_AGENT_FILTER } from '../queries/shared/activeSystemAgentFilter';

import { SYSTEM_SEED_ADMIN_ID } from './constants';
import { readSystemAgentSeedFile } from './readSystemAgentSeedFile';
import { systemAgentSeedSchema } from './schema';

import type { LoadSystemAgentsResult, SystemAgentSeedEntry } from './types';

const isDuplicateKeyError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return (error as { code?: number }).code === 11000;
};

export const parseSystemAgentSeedJson = (content: string): SystemAgentSeedEntry[] => {
  const parsed = JSON.parse(content) as unknown;
  return systemAgentSeedSchema.array().parse(parsed);
};

export const loadSystemAgents = async (): Promise<LoadSystemAgentsResult> => {
  try {
    const content = await readSystemAgentSeedFile();
    const seedEntries = parseSystemAgentSeedJson(content);

    const existingRows = await systemAgentMongodbDao.collection
      .find(ACTIVE_SYSTEM_AGENT_FILTER)
      .project({ name: 1 })
      .toArray();
    const existingNameSet = new Set(
      existingRows.map((row) => (row.name as string).trim().toLowerCase()),
    );

    const newEntries = seedEntries.filter(
      (entry) => !existingNameSet.has(entry.name.trim().toLowerCase()),
    );

    if (newEntries.length === 0) {
      return { insertedCount: 0, skippedCount: seedEntries.length };
    }

    const instances = newEntries.map((entry) =>
      systemAgentFactory.create({
        ...entry,
        status: SYSTEM_AGENT_DEFAULT_STATUS,
        removedAt: null,
        createdByAdminId: SYSTEM_SEED_ADMIN_ID,
        updatedByAdminId: SYSTEM_SEED_ADMIN_ID,
      }),
    );

    try {
      await systemAgentMongodbDao.createMany(instances);
      console.log(`Seeded ${instances.length} system agents`);

      await Promise.all(
        newEntries.map((entry) => invalidateActiveByNameCache({ name: entry.name })),
      );

      return {
        insertedCount: instances.length,
        skippedCount: seedEntries.length - instances.length,
      };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return { insertedCount: 0, skippedCount: seedEntries.length };
      }

      throw error;
    }
  } catch (error) {
    console.error(error);
    return { insertedCount: 0, skippedCount: 0 };
  }
};
