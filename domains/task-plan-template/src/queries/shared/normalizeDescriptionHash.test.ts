import { createHash } from 'node:crypto';

import { describe, it, expect } from 'vitest';

import { normalizeDescriptionHash } from './normalizeDescriptionHash';

const hashNormalizedText = (text: string): string =>
  createHash('sha256').update(text).digest('hex');

describe('normalizeDescriptionHash', () => {
  it('should return SHA-256 of lowercased whitespace-collapsed punctuation-stripped description', () => {
    const result = normalizeDescriptionHash({
      description: '  Review   NDA,  clauses!  ',
    });

    const expected = hashNormalizedText('review nda clauses');

    expect(result).toBe(expected);
  });

  it('should return the same hash for equivalent normalized descriptions', () => {
    const first = normalizeDescriptionHash({
      description: 'Contract-Risk Review.',
    });
    const second = normalizeDescriptionHash({
      description: 'contract risk review',
    });

    expect(first).toBe(second);
  });
});
