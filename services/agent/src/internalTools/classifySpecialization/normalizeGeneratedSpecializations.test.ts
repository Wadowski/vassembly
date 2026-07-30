import { describe, expect, it } from 'vitest';

import { normalizeGeneratedSpecializations } from './normalizeGeneratedSpecializations';

const CATALOG_ITEMS = [
  { id: 'spec-legal', name: 'legal' },
  { id: 'spec-finance', name: 'finance' },
  { id: 'spec-hr', name: 'hr' },
  { id: 'spec-engineering', name: 'engineering' },
  { id: 'spec-notion', name: 'notion' },
  { id: 'spec-slack', name: 'slack' },
  { id: 'spec-food', name: 'food & nutrition' },
];

describe('normalizeGeneratedSpecializations', () => {
  it('should return empty_output when raw output has no lines', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: '   \n  ',
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({ isValid: false, reason: 'empty_output' });
  });

  it('should return invalid_output when output has no matches and no NEW line', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'unknown-domain',
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({ isValid: false, reason: 'invalid_output' });
  });

  it('should fuzzy-match partial specialization names such as food to food & nutrition', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'food',
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({
      isValid: true,
      existingSpecializationIds: ['spec-food'],
      newSpecializations: [],
    });
  });

  it('should return mixed existing and NEW specializations in one result when both appear in output', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'legal\nNEW:airtable|Handles Airtable updates\nnotion',
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({
      isValid: true,
      existingSpecializationIds: ['spec-legal', 'spec-notion'],
      newSpecializations: [{ name: 'airtable', description: 'Handles Airtable updates' }],
    });
  });

  it('should parse multiple NEW lines into distinct new specialization entries', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'NEW:airtable|Airtable workspace tasks\nNEW:slack|Slack messaging',
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({
      isValid: true,
      existingSpecializationIds: [],
      newSpecializations: [
        { name: 'airtable', description: 'Airtable workspace tasks' },
        { name: 'slack', description: 'Slack messaging' },
      ],
    });
  });

  it('should retain only the first 5 valid entries when output exceeds the cap', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'legal\nfinance\nhr\nengineering\nnotion\nslack',
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({
      isValid: true,
      existingSpecializationIds: [
        'spec-legal',
        'spec-finance',
        'spec-hr',
        'spec-engineering',
        'spec-notion',
      ],
      newSpecializations: [],
    });
  });

  it('should deduplicate existing specialization names case-insensitively', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'Legal\nlegal\nFINANCE',
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({
      isValid: true,
      existingSpecializationIds: ['spec-legal', 'spec-finance'],
      newSpecializations: [],
    });
  });

  it('should return a single existing specialization for single-domain output', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'legal',
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({
      isValid: true,
      existingSpecializationIds: ['spec-legal'],
      newSpecializations: [],
    });
  });

  it('should ignore unrecognized lines when valid existing matches are present', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'legal\nunknown\nfinance',
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({
      isValid: true,
      existingSpecializationIds: ['spec-legal', 'spec-finance'],
      newSpecializations: [],
    });
  });
});
