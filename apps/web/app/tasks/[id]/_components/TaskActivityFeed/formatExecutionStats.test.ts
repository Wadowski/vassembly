import { describe, expect, it } from 'vitest';

import { formatExecutionStats } from './formatExecutionStats';

describe('formatExecutionStats', () => {
  it('should format duration and input/output tokens', () => {
    expect(
      formatExecutionStats({
        durationMs: 65_000,
        tokenUsage: { input: 1200, output: 340, total: 1540 },
      }),
    ).toBe('1m 5s · 1,200 in · 340 out');
  });

  it('should format tokens only when duration is missing', () => {
    expect(
      formatExecutionStats({
        tokenUsage: { input: 10, output: 5, total: 15 },
      }),
    ).toBe('10 in · 5 out');
  });

  it('should return empty string when no metrics exist', () => {
    expect(formatExecutionStats({})).toBe('');
  });
});
