import { describe, expect, it } from 'vitest';

import { aggregateProgressStats } from './aggregateProgressStats';

describe('aggregateProgressStats', () => {
  it('should sum token usage from events when stored totals are zero', () => {
    const stats = aggregateProgressStats({
      events: [
        {
          id: '1',
          agentId: 'agent-1',
          state: 'completed',
          timestamp: new Date('2026-01-01T00:00:00.000Z'),
          duration: 1200,
          tokenUsage: { input: 100, output: 50, total: 150 },
        },
      ],
      totalDuration: 0,
      totalTokens: { input: 0, output: 0, total: 0 },
    });

    expect(stats.totalDuration).toBe(1200);
    expect(stats.totalTokens).toEqual({ input: 100, output: 50, total: 150 });
  });

  it('should prefer stored totals when present', () => {
    const stats = aggregateProgressStats({
      events: [],
      totalDuration: 5000,
      totalTokens: { input: 10, output: 5, total: 15 },
    });

    expect(stats.totalDuration).toBe(5000);
    expect(stats.totalTokens).toEqual({ input: 10, output: 5, total: 15 });
  });
});
