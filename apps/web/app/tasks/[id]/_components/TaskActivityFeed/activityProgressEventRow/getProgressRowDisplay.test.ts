import { describe, expect, it } from 'vitest';

import {
  getProgressAgentName,
  getProgressStatusLabel,
} from './getProgressRowDisplay';

describe('getProgressRowDisplay', () => {
  it('should prefer agent name for agent display', () => {
    expect(
      getProgressAgentName({
        item: {
          kind: 'progressEvent',
          id: 'p1',
          occurredAt: '2026-01-01T00:00:00.000Z',
          sortKey: 'p1',
          filterGroup: 'agentStarted',
          agentName: 'Research Agent',
          integrationName: 'LM Studio',
          agentId: 'agent-long-id',
        },
      }),
    ).toBe('Research Agent');
  });

  it('should map completed state to Completed label', () => {
    expect(
      getProgressStatusLabel({
        item: {
          kind: 'progressEvent',
          id: 'p1',
          occurredAt: '2026-01-01T00:00:00.000Z',
          sortKey: 'p1',
          filterGroup: 'agentFinished',
          state: 'completed',
        },
      }),
    ).toBe('Completed');
  });
});
