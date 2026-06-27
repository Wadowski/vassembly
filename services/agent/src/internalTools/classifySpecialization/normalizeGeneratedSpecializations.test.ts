import { describe, expect, it } from 'vitest';

import { normalizeGeneratedSpecializations } from './normalizeGeneratedSpecializations';

const EXISTING_BY_LOWER_NAME = new Map<string, string>([
  ['legal', 'spec-legal'],
  ['finance', 'spec-finance'],
  ['hr', 'spec-hr'],
]);

describe('normalizeGeneratedSpecializations', () => {
  it('should return empty_output when raw output has no lines', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: '   \n  ',
      existingByLowerName: EXISTING_BY_LOWER_NAME,
    });

    expect(result).toEqual({ isValid: false, reason: 'empty_output' });
  });

  it('should return invalid_output when output has no matches and no NEW line', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'unknown-domain',
      existingByLowerName: EXISTING_BY_LOWER_NAME,
    });

    expect(result).toEqual({ isValid: false, reason: 'invalid_output' });
  });

  it('should parse NEW line into new specialization signal', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'NEW: legal|Handles legal tasks',
      existingByLowerName: EXISTING_BY_LOWER_NAME,
    });

    expect(result).toEqual({
      isValid: true,
      type: 'new',
      name: 'legal',
      description: 'Handles legal tasks',
    });
  });

  it('should match existing specialization names case-insensitively', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'Legal\nFINANCE',
      existingByLowerName: EXISTING_BY_LOWER_NAME,
    });

    expect(result).toEqual({
      isValid: true,
      type: 'existing',
      specializationIds: ['spec-legal', 'spec-finance'],
    });
  });

  it('should return too_many_results when more than 3 lines are present', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'legal\nfinance\nhr\nops',
      existingByLowerName: EXISTING_BY_LOWER_NAME,
    });

    expect(result).toEqual({ isValid: false, reason: 'too_many_results' });
  });

  it('should ignore unknown lines when valid existing matches are present', () => {
    const result = normalizeGeneratedSpecializations({
      rawOutput: 'legal\nunknown\nfinance',
      existingByLowerName: EXISTING_BY_LOWER_NAME,
    });

    expect(result).toEqual({
      isValid: true,
      type: 'existing',
      specializationIds: ['spec-legal', 'spec-finance'],
    });
  });
});
