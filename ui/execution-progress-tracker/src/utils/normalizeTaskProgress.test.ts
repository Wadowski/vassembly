import { describe, it, expect } from 'vitest';

import { normalizeTaskProgress } from './normalizeTaskProgress';

const BASE_RAW = {
  id: 'progress-1',
  taskId: 'task-1',
  startedAt: '2026-06-15T10:00:00.000Z',
  completedAt: null,
  totalDuration: 1000,
  totalTokens: { input: 10, output: 20, total: 30 },
  events: [],
};

describe('normalizeTaskProgress', () => {
  it('should map integration fields on progress events', () => {
    const result = normalizeTaskProgress({
      ...BASE_RAW,
      events: [
        {
          id: 'event-1',
          agentId: 'agent-1',
          agentName: 'Research Agent',
          state: 'started',
          timestamp: '2026-06-15T10:00:01.000Z',
          integrationName: 'My OpenAI',
          provider: 'chatgpt',
          model: 'gpt-4o',
        },
      ],
    });

    expect(result.events[0]?.integrationName).toBe('My OpenAI');
    expect(result.events[0]?.provider).toBe('chatgpt');
    expect(result.events[0]?.model).toBe('gpt-4o');
  });

  it('should default integration fields to null when absent', () => {
    const result = normalizeTaskProgress({
      ...BASE_RAW,
      events: [
        {
          id: 'event-1',
          agentId: 'agent-1',
          state: 'completed',
          timestamp: '2026-06-15T10:00:01.000Z',
        },
      ],
    });

    expect(result.events[0]?.integrationName).toBeNull();
    expect(result.events[0]?.provider).toBeNull();
    expect(result.events[0]?.model).toBeNull();
  });
});
