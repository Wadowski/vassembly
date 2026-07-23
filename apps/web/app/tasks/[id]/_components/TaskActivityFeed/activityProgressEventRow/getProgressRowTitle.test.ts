import { describe, expect, it } from 'vitest';

import { getProgressRowTitle } from './getProgressRowTitle';

describe('getProgressRowTitle', () => {
  it('should return started label for started progress events', () => {
    const title = getProgressRowTitle({
      item: {
        kind: 'progressEvent',
        id: 'p-1',
        occurredAt: '2026-01-01T00:00:00.000Z',
        sortKey: 'p-1',
        filterGroup: 'agentStarted',
        state: 'started',
      },
    });

    expect(title).toBe('Processing started');
  });
});
