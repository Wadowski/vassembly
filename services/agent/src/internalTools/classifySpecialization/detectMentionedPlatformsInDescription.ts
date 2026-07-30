import { resolveExistingSpecializationMatch } from './resolveExistingSpecializationMatch';

import type { CatalogSpecializationEntry } from './resolveExistingSpecializationMatch';
import type { NewSpecializationEntry } from './types';

export interface McpCatalogHintEntry {
  name: string;
  slug: string;
  description: string;
  tags: string[];
}

export interface DetectMentionedPlatformsInDescriptionParams {
  description: string;
  mcpItems: McpCatalogHintEntry[];
  catalogItems: CatalogSpecializationEntry[];
}

export interface DetectMentionedPlatformsInDescriptionResult {
  existingSpecializationIds: string[];
  newSpecializations: NewSpecializationEntry[];
}

const GENERIC_MCP_TAGS = new Set([
  'knowledge',
  'productivity',
  'search',
  'communication',
  'automation',
  'integration',
  'api',
  'data',
]);

const escapeRegExp = ({ value }: { value: string }): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsKeyword = ({
  description,
  keyword,
}: {
  description: string;
  keyword: string;
}): boolean => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (normalizedKeyword.length < 3) {
    return false;
  }

  const pattern = new RegExp(`\\b${escapeRegExp({ value: normalizedKeyword })}\\b`, 'i');

  return pattern.test(description);
};

const buildPlatformKeywords = ({ mcp }: { mcp: McpCatalogHintEntry }): string[] => {
  const slugKeyword = mcp.slug.replace(/-mcp$/, '').replace(/-/g, ' ').trim();
  const nameKeyword = mcp.name.replace(/\s*mcp\s*/gi, ' ').trim().toLowerCase();
  const tagKeywords = mcp.tags.filter((tag) => !GENERIC_MCP_TAGS.has(tag.toLowerCase()));

  return [...new Set([slugKeyword, nameKeyword, ...tagKeywords].filter((keyword) => keyword.length >= 3))];
};

const resolvePlatformSpecialization = ({
  platformName,
  mcpDescription,
  catalogItems,
}: {
  platformName: string;
  mcpDescription: string;
  catalogItems: CatalogSpecializationEntry[];
}): { type: 'existing'; specializationId: string } | { type: 'new'; entry: NewSpecializationEntry } => {
  const existingId = resolveExistingSpecializationMatch({
    candidate: platformName,
    catalogItems,
  });

  if (existingId) {
    return { type: 'existing', specializationId: existingId };
  }

  return {
    type: 'new',
    entry: {
      name: platformName.toLowerCase(),
      description: mcpDescription || `Handles ${platformName} integrations, content, and workflows`,
    },
  };
};

export const detectMentionedPlatformsInDescription = ({
  description,
  mcpItems,
  catalogItems,
}: DetectMentionedPlatformsInDescriptionParams): DetectMentionedPlatformsInDescriptionResult => {
  const existingSpecializationIds: string[] = [];
  const newSpecializations: NewSpecializationEntry[] = [];
  const seenExistingIds = new Set<string>();
  const seenNewNames = new Set<string>();

  for (const mcp of mcpItems) {
    const keywords = buildPlatformKeywords({ mcp });
    const matchedKeyword = keywords.find((keyword) =>
      containsKeyword({ description, keyword }),
    );

    if (!matchedKeyword) {
      continue;
    }

    const platformName = matchedKeyword.toLowerCase();
    const resolved = resolvePlatformSpecialization({
      platformName,
      mcpDescription: mcp.description,
      catalogItems,
    });

    if (resolved.type === 'existing') {
      if (seenExistingIds.has(resolved.specializationId)) {
        continue;
      }

      seenExistingIds.add(resolved.specializationId);
      existingSpecializationIds.push(resolved.specializationId);
      continue;
    }

    if (seenNewNames.has(resolved.entry.name)) {
      continue;
    }

    seenNewNames.add(resolved.entry.name);
    newSpecializations.push(resolved.entry);
  }

  return {
    existingSpecializationIds,
    newSpecializations,
  };
};
