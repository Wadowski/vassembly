import { describe, expect, it } from 'vitest';

import { mergeTimelineItems } from './mergeTimelineItems';

describe('mergeTimelineItems', () => {
  it('should merge progress events and answered questions chronologically', () => {
    const items = mergeTimelineItems({
      events: [
        {
          id: 'event-1',
          agentId: 'agent-1',
          agentName: 'Research Agent',
          parentAgentId: null,
          state: 'STARTED',
          timestamp: new Date('2026-06-15T10:00:00.000Z'),
          duration: null,
          inputMessages: null,
          generatedResponse: null,
          tokenUsage: null,
          errorDetails: null,
          integrationName: null,
          provider: null,
          model: null,
        },
        {
          id: 'event-2',
          agentId: 'agent-1',
          agentName: 'Research Agent',
          parentAgentId: null,
          state: 'COMPLETED',
          timestamp: new Date('2026-06-15T10:05:00.000Z'),
          duration: 300000,
          inputMessages: null,
          generatedResponse: null,
          tokenUsage: null,
          errorDetails: null,
          integrationName: null,
          provider: null,
          model: null,
        },
      ],
      answeredQuestions: [
        {
          questionId: 'q-1',
          question: 'Which region?',
          answer: 'Europe',
          askedAt: '2026-06-15T10:02:00.000Z',
          answeredAt: '2026-06-15T10:03:00.000Z',
        },
      ],
    });

    expect(items.map((item) => item.id)).toEqual([
      'event-1',
      'question-asked-q-1',
      'answer-submitted-q-1',
      'event-2',
    ]);
  });
});
