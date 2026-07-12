import { describe, expect, it } from 'vitest';

import { formatLocalDateTime } from './formatLocalDateTime';

describe('formatLocalDateTime', () => {
  it('should format a date in DD.MM.YYYY hh:mm using local timezone', () => {
    const date = new Date(2026, 5, 15, 14, 30);

    expect(formatLocalDateTime(date)).toBe('15.06.2026 14:30');
  });

  it('should pad single-digit day, month, hours, and minutes', () => {
    const date = new Date(2026, 0, 3, 9, 5);

    expect(formatLocalDateTime(date)).toBe('03.01.2026 09:05');
  });
});
