import { systemAgentMongodbDao } from '../clients';
import { SYSTEM_AGENT_DEFAULT_STATUS } from '../constants';
import { invalidateActiveByNameCache } from '../cache/keys';
import { systemAgentFactory } from '../model';
import { ACTIVE_SYSTEM_AGENT_FILTER } from '../queries/shared/activeSystemAgentFilter';

import { SYSTEM_SEED_ADMIN_ID } from './constants';
import { readSystemAgentSeedFile } from './readSystemAgentSeedFile';
import { systemAgentSeedSchema } from './schema';

import type { ObjectId } from 'mongodb';

import type { LoadSystemAgentsResult, SystemAgentSeedEntry } from './types';

const isDuplicateKeyError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return (error as { code?: number }).code === 11000;
};

const normalizeAssignedToolIds = (toolIds: string[] | undefined): string[] => toolIds ?? [];

const areAssignedToolIdsEqual = ({
  left,
  right,
}: {
  left: string[] | undefined;
  right: string[] | undefined;
}): boolean => {
  const normalizedLeft = normalizeAssignedToolIds(left);
  const normalizedRight = normalizeAssignedToolIds(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((toolId, index) => toolId === normalizedRight[index]);
};

interface ExistingSeedAgentRow {
  _id: ObjectId;
  name: string;
  rule?: string;
  description?: string;
  category?: string;
  assignedToolIds?: string[];
}

const shouldSyncSeedEntry = ({
  entry,
  existing,
}: {
  entry: SystemAgentSeedEntry;
  existing: ExistingSeedAgentRow;
}): boolean =>
  existing.rule !== entry.rule ||
  (existing.description ?? '') !== (entry.description ?? '') ||
  (existing.category ?? undefined) !== (entry.category ?? undefined) ||
  !areAssignedToolIdsEqual({
    left: existing.assignedToolIds,
    right: entry.assignedToolIds,
  });

const isSeedEntryActive = (entry: SystemAgentSeedEntry): boolean => entry._disabled !== true;

const toAgentSeedFields = ({
  _disabled,
  ...agentFields
}: SystemAgentSeedEntry): Omit<SystemAgentSeedEntry, '_disabled'> => {
  void _disabled;
  return agentFields;
};

export const parseSystemAgentSeedJson = (content: string): SystemAgentSeedEntry[] => {
  const parsed = JSON.parse(content) as unknown;
  return systemAgentSeedSchema.array().parse(parsed);
};

const getActiveSeedEntries = (entries: SystemAgentSeedEntry[]): SystemAgentSeedEntry[] =>
  entries.filter(isSeedEntryActive);

export const loadSystemAgents = async (): Promise<LoadSystemAgentsResult> => {
  try {
    const content = await readSystemAgentSeedFile();
    const seedEntries = getActiveSeedEntries(parseSystemAgentSeedJson(content));

    const existingRows = (await systemAgentMongodbDao.collection
      .find(ACTIVE_SYSTEM_AGENT_FILTER)
      .project({ name: 1, rule: 1, description: 1, category: 1, assignedToolIds: 1 })
      .toArray()) as ExistingSeedAgentRow[];

    const existingByLowerName = new Map(
      existingRows.map((row) => [row.name.trim().toLowerCase(), row]),
    );

    const newEntries = seedEntries.filter(
      (entry) => !existingByLowerName.has(entry.name.trim().toLowerCase()),
    );

    let insertedCount = 0;

    if (newEntries.length > 0) {
      const instances = newEntries.map((entry) =>
        systemAgentFactory.create({
          ...toAgentSeedFields(entry),
          status: SYSTEM_AGENT_DEFAULT_STATUS,
          removedAt: null,
          createdByAdminId: SYSTEM_SEED_ADMIN_ID,
          updatedByAdminId: SYSTEM_SEED_ADMIN_ID,
        }),
      );

      try {
        await systemAgentMongodbDao.createMany(instances);
        console.log(`Seeded ${instances.length} system agents`);
        insertedCount = instances.length;

        await Promise.all(
          newEntries.map((entry) => invalidateActiveByNameCache({ name: entry.name })),
        );
      } catch (error) {
        if (!isDuplicateKeyError(error)) {
          throw error;
        }
      }
    }

    let updatedCount = 0;

    for (const entry of seedEntries) {
      const existing = existingByLowerName.get(entry.name.trim().toLowerCase());

      if (existing === undefined || !shouldSyncSeedEntry({ entry, existing })) {
        continue;
      }

      await systemAgentMongodbDao.collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            rule: entry.rule,
            description: entry.description,
            category: entry.category,
            assignedToolIds: normalizeAssignedToolIds(entry.assignedToolIds),
            updatedByAdminId: SYSTEM_SEED_ADMIN_ID,
            updatedAt: new Date(),
          },
        },
      );

      updatedCount += 1;
      await invalidateActiveByNameCache({ name: entry.name });
    }

    if (updatedCount > 0) {
      console.log(`Synced ${updatedCount} system agents from seed`);
    }

    return {
      insertedCount,
      skippedCount: seedEntries.length - insertedCount - updatedCount,
      updatedCount,
    };
  } catch (error) {
    console.error(error);
    return { insertedCount: 0, skippedCount: 0, updatedCount: 0 };
  }
};
