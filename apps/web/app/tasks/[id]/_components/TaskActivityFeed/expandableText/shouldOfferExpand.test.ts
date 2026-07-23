import { describe, expect, it } from 'vitest';

import { shouldOfferExpand } from './shouldOfferExpand';

describe('shouldOfferExpand', () => {
  it('should return false for short single-line text', () => {
    expect(shouldOfferExpand({ text: 'Hello' })).toBe(false);
  });

  it('should return true when text exceeds character threshold', () => {
    expect(shouldOfferExpand({ text: 'a'.repeat(281) })).toBe(true);
  });

  it('should return true when text has more than four lines', () => {
    expect(shouldOfferExpand({ text: 'line\nline\nline\nline\nline' })).toBe(true);
  });
});
