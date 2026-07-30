import { MAX_SPECIALIZATION_RESULTS } from '@vassembly/constants';

import { resolveExistingSpecializationMatch } from './resolveExistingSpecializationMatch';

import type { CatalogSpecializationEntry } from './resolveExistingSpecializationMatch';
import type { NewSpecializationEntry } from './types';

const NEW_PREFIX = 'NEW:';

export type NormalizeGeneratedSpecializationsResult =
  | {
      isValid: true;
      existingSpecializationIds: string[];
      newSpecializations: NewSpecializationEntry[];
    }
  | { isValid: false; reason: 'empty_output' | 'invalid_output' };

export interface NormalizeGeneratedSpecializationsParams {
  rawOutput: string;
  catalogItems: CatalogSpecializationEntry[];
}

const parseNewLine = ({
  line,
}: {
  line: string;
}): NewSpecializationEntry | null => {
  const payload = line.slice(NEW_PREFIX.length).trim();

  if (!payload.includes('|')) {
    return null;
  }

  const separatorIndex = payload.indexOf('|');
  const name = payload.slice(0, separatorIndex).trim().toLowerCase();
  const description = payload.slice(separatorIndex + 1).trim();

  if (!name || !description) {
    return null;
  }

  return { name, description };
};

export const normalizeGeneratedSpecializations = ({
  rawOutput,
  catalogItems,
}: NormalizeGeneratedSpecializationsParams): NormalizeGeneratedSpecializationsResult => {
  const lines = rawOutput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { isValid: false, reason: 'empty_output' };
  }

  const existingSpecializationIds: string[] = [];
  const newSpecializations: NewSpecializationEntry[] = [];
  const seenExistingIds = new Set<string>();
  const seenNewNames = new Set<string>();
  let totalCount = 0;

  for (const line of lines) {
    if (totalCount >= MAX_SPECIALIZATION_RESULTS) {
      break;
    }

    if (line.toUpperCase().startsWith(NEW_PREFIX)) {
      const parsed = parseNewLine({ line });

      if (parsed === null || seenNewNames.has(parsed.name)) {
        continue;
      }

      seenNewNames.add(parsed.name);
      newSpecializations.push(parsed);
      totalCount += 1;
      continue;
    }

    const specializationId = resolveExistingSpecializationMatch({
      candidate: line,
      catalogItems,
    });

    if (specializationId === undefined || seenExistingIds.has(specializationId)) {
      continue;
    }

    seenExistingIds.add(specializationId);
    existingSpecializationIds.push(specializationId);
    totalCount += 1;
  }

  if (existingSpecializationIds.length === 0 && newSpecializations.length === 0) {
    return { isValid: false, reason: 'invalid_output' };
  }

  return {
    isValid: true,
    existingSpecializationIds,
    newSpecializations,
  };
};
