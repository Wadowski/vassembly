import { VALID_SEED_ENTRIES } from '../../seed/testFixtures';

import type { McpModel } from '../../model';
import type { McpSeedEntry } from '../../seed/types';

export const SEED_MCPS: McpSeedEntry[] = VALID_SEED_ENTRIES;

const BASE_DATE = new Date('2026-06-01T00:00:00.000Z');

export const toMcpDoc = (entry: McpSeedEntry, index: number): Partial<McpModel> => ({
  id: `mcp-${index + 1}`,
  slug: entry.slug,
  name: entry.name,
  description: entry.description,
  tags: entry.tags,
  iconPath: entry.iconPath,
  documentationUrl: entry.documentationUrl ?? null,
  repositoryUrl: entry.repositoryUrl ?? null,
  configSchema: entry.configSchema,
  category: entry.category ?? null,
  transport: entry.transport,
  createdAt: BASE_DATE,
  updatedAt: BASE_DATE,
});

export const SEED_MCP_DOCS = SEED_MCPS.map(toMcpDoc);

export const buildPaginationDataset = (count: number): Partial<McpModel>[] => {
  const docs = SEED_MCP_DOCS.map((doc) => ({ ...doc }));

  for (let index = docs.length; index < count; index += 1) {
    const label = String(index + 1).padStart(2, '0');
    docs.push(
      toMcpDoc(
        {
          slug: `extra-mcp-${label}`,
          name: `Extra MCP ${label}`,
          description: `Additional MCP catalog entry ${label}`,
          tags: ['catalog'],
          iconPath: `/mcps/extra-${label}.svg`,
          transport: 'stdio-wrapped',
        },
        index,
      ),
    );
  }

  return docs;
};

const matchesRegexFilter = ({
  value,
  pattern,
}: {
  value: string;
  pattern: RegExp | string;
}): boolean => {
  if (pattern instanceof RegExp) {
    return pattern.test(value);
  }

  return new RegExp(pattern, 'i').test(value);
};

const matchesDocument = (doc: Partial<McpModel>, filter: Record<string, unknown>): boolean => {
  if (Object.keys(filter).length === 0) {
    return true;
  }

  if ('$and' in filter && Array.isArray(filter.$and)) {
    return (filter.$and as Record<string, unknown>[]).every((condition) => matchesDocument(doc, condition));
  }

  if ('$or' in filter && Array.isArray(filter.$or)) {
    return (filter.$or as Record<string, unknown>[]).some((condition) => matchesDocument(doc, condition));
  }

  if ('tags' in filter) {
    const tagsFilter = filter.tags as { $in?: string[] };
    const selectedTags = tagsFilter.$in ?? [];
    return (doc.tags ?? []).some((tag) => selectedTags.includes(tag));
  }

  for (const [field, condition] of Object.entries(filter)) {
    if (field.startsWith('$')) {
      continue;
    }

    const fieldValue = doc[field as keyof McpModel];
    if (typeof fieldValue !== 'string') {
      return false;
    }

    const regexCondition = condition as { $regex?: RegExp | string; $options?: string };
    if (regexCondition.$regex !== undefined) {
      return matchesRegexFilter({ value: fieldValue, pattern: regexCondition.$regex });
    }
  }

  return true;
};

export const createInMemoryMcpStore = (docs: Partial<McpModel>[]) => {
  const store = [...docs];

  const query = (filter: Record<string, unknown> = {}) => store.filter((doc) => matchesDocument(doc, filter));

  return {
    getManyRaw: async (
      filter: Record<string, unknown>,
      options: { sort?: Record<string, 1 | -1>; offset?: number; limit?: number } = {},
    ) => {
      const sorted = query(filter).sort((left, right) => {
        const direction = options.sort?.name ?? 1;
        const leftName = left.name ?? '';
        const rightName = right.name ?? '';
        return direction === 1 ? leftName.localeCompare(rightName) : rightName.localeCompare(leftName);
      });

      const offset = options.offset ?? 0;
      const limit = options.limit ?? sorted.length;
      return sorted.slice(offset, offset + limit);
    },
    countDocuments: async (filter: Record<string, unknown> = {}) => query(filter).length,
  };
};
