import { mcpMongodbDao } from '../../clients';
import { mcpFactory } from '../model';

import { readMcpSeedFile } from './readMcpSeedFile';
import { mcpSeedSchema } from './schema';

import type { McpSeedEntry, LoadMcpsResult } from './types';

export const parseMcpSeedJson = (content: string): McpSeedEntry[] => {
  const parsed = JSON.parse(content) as unknown;
  return mcpSeedSchema.array().parse(parsed);
};

export const loadMcps = async (): Promise<LoadMcpsResult> => {
  try {
    const content = await readMcpSeedFile();
    const seedEntries = parseMcpSeedJson(content);

    const existingSlugs = await mcpMongodbDao.collection
      .find({})
      .project({ slug: 1 })
      .toArray();
    const existingSlugSet = new Set(existingSlugs.map((doc) => doc.slug));

    const newEntries = seedEntries.filter((entry) => !existingSlugSet.has(entry.slug));

    if (newEntries.length === 0) {
      return { insertedCount: 0, skippedCount: seedEntries.length };
    }

    const instances = newEntries.map((entry) =>
      mcpFactory.create({
        ...entry,
        documentationUrl: entry.documentationUrl ?? null,
        repositoryUrl: entry.repositoryUrl ?? null,
      }),
    );

    await mcpMongodbDao.createMany(instances);

    console.log(`Seeded ${instances.length} MCPs`);

    return { insertedCount: instances.length, skippedCount: seedEntries.length - instances.length };
  } catch (error) {
    console.error(error);
    return { insertedCount: 0, skippedCount: 0 };
  }
};
