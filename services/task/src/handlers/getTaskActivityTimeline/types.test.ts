import { describe, expect, it, vi } from 'vitest';

vi.mock('@vassembly/domain-task-progress', () => ({
  ProgressEventState: {
    Started: 'started',
    Completed: 'completed',
    Failed: 'failed',
    Waiting: 'waiting',
  },
}));

import { mapProgressStateToFilterGroup } from './types';

describe('mapProgressStateToFilterGroup', () => {
  it('should map completed state to agentFinished', () => {
    expect(mapProgressStateToFilterGroup({ state: 'completed' })).toBe('agentFinished');
  });

  it('should map failed state to agentFailed', () => {
    expect(mapProgressStateToFilterGroup({ state: 'failed' })).toBe('agentFailed');
  });
});
