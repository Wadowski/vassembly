import { MAX_SPECIALIZATION_RESULTS } from '@vassembly/constants';

import { detectMentionedPlatformsInDescription } from './detectMentionedPlatformsInDescription';

import type { CatalogSpecializationEntry } from './resolveExistingSpecializationMatch';
import type { McpCatalogHintEntry } from './detectMentionedPlatformsInDescription';
import type { NormalizeGeneratedSpecializationsResult } from './normalizeGeneratedSpecializations';

export interface SupplementClassificationWithDetectedDomainsParams {
  classification: NormalizeGeneratedSpecializationsResult;
  description: string;
  catalogItems: CatalogSpecializationEntry[];
  mcpItems: McpCatalogHintEntry[];
}

export const supplementClassificationWithDetectedDomains = ({
  classification,
  description,
  catalogItems,
  mcpItems,
}: SupplementClassificationWithDetectedDomainsParams): NormalizeGeneratedSpecializationsResult => {
  if (!classification.isValid) {
    return classification;
  }

  const detected = detectMentionedPlatformsInDescription({
    description,
    mcpItems,
    catalogItems,
  });

  const existingSpecializationIds = [...classification.existingSpecializationIds];
  const newSpecializations = [...classification.newSpecializations];
  const seenExistingIds = new Set(existingSpecializationIds);
  const seenNewNames = new Set(newSpecializations.map((entry) => entry.name));

  const appendDetected = (): void => {
    for (const specializationId of detected.existingSpecializationIds) {
      if (existingSpecializationIds.length + newSpecializations.length >= MAX_SPECIALIZATION_RESULTS) {
        return;
      }

      if (seenExistingIds.has(specializationId)) {
        continue;
      }

      seenExistingIds.add(specializationId);
      existingSpecializationIds.push(specializationId);
    }

    for (const entry of detected.newSpecializations) {
      if (existingSpecializationIds.length + newSpecializations.length >= MAX_SPECIALIZATION_RESULTS) {
        return;
      }

      if (seenNewNames.has(entry.name)) {
        continue;
      }

      seenNewNames.add(entry.name);
      newSpecializations.push(entry);
    }
  };

  appendDetected();

  if (existingSpecializationIds.length === 0 && newSpecializations.length === 0) {
    return { isValid: false, reason: 'invalid_output' };
  }

  return {
    isValid: true,
    existingSpecializationIds,
    newSpecializations,
  };
};
