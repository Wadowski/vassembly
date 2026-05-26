import { describe, it, expect } from 'vitest';
import { toIsoString } from './toIsoString';

describe('toIsoString', () => {
  it('converts valid Date to ISO string', () => {
    const date = new Date('2026-05-26T12:00:00Z');
    const result = toIsoString({ value: date, fieldName: 'testField' });
    expect(result).toBe('2026-05-26T12:00:00.000Z');
  });

  it('throws error for invalid Date', () => {
    const invalidDate = new Date('invalid');
    expect(() =>
      toIsoString({ value: invalidDate, fieldName: 'testField' })
    ).toThrow('testField must be a valid Date');
  });

  it('throws error for non-Date value', () => {
    expect(() =>
      toIsoString({ value: '2026-05-26' as unknown as Date, fieldName: 'testField' })
    ).toThrow('testField must be a valid Date');
  });

  it('includes field name in error message', () => {
    const invalidDate = new Date('invalid');
    expect(() =>
      toIsoString({ value: invalidDate, fieldName: 'createdAt' })
    ).toThrow('createdAt must be a valid Date');
  });
});
