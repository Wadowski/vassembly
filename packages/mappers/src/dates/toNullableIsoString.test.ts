import { describe, it, expect } from 'vitest';
import { toNullableIsoString } from './toNullableIsoString';

describe('toNullableIsoString', () => {
  it('converts valid Date to ISO string', () => {
    const date = new Date('2026-05-26T12:00:00Z');
    const result = toNullableIsoString(date);
    expect(result).toBe('2026-05-26T12:00:00.000Z');
  });

  it('returns null for null input', () => {
    expect(toNullableIsoString(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(toNullableIsoString(undefined)).toBeNull();
  });

  it('converts valid Date when not null', () => {
    const date = new Date('2026-01-15T08:30:00Z');
    const result = toNullableIsoString(date);
    expect(result).toBe('2026-01-15T08:30:00.000Z');
  });
});
