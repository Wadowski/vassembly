import { describe, it, expect } from 'vitest';

import { mapMcpUsageEventsToTimelineItems } from './mapMcpUsageEventsToTimelineItems';

import { McpUsageStatus, type McpUsageEventModel } from '@vassembly/domain-mcp-usage';

const createEvent = (overrides: Partial<McpUsageEventModel> = {}): McpUsageEventModel =>
  ({
    id: 'event-1',
    mcpId: 'mcp-1',
    mcpSlug: 'brave',
    toolName: 'search',
    userId: 'user-1',
    taskId: 'task-1',
    commentId: 'comment-1',
    agentId: 'agent-1',
    status: 'in_progress',
    startedAt: new Date('2026-01-01T10:00:00.000Z'),
    input: { query: 'test' },
    inputTruncated: false,
    ...overrides,
  }) as McpUsageEventModel;

describe('mapMcpUsageEventsToTimelineItems', () => {
  it('should map each usage event to a single timeline item anchored at startedAt', () => {
    const items = mapMcpUsageEventsToTimelineItems({
      events: [createEvent()],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: 'mcpInvocation',
      id: 'mcp-event-1',
      status: 'in_progress',
      startedAt: '2026-01-01T10:00:00.000Z',
      input: '{\n  "query": "test"\n}',
    });
  });

  it('should include toolDisplayName when present on the usage event', () => {
    const items = mapMcpUsageEventsToTimelineItems({
      events: [
        createEvent({
          toolName: 'mcp__wiki-id__list_registries',
          toolDisplayName: 'wikipedia-mcp - list-registries',
        }),
      ],
    });

    expect(items[0]?.kind).toBe('mcpInvocation');
    if (items[0]?.kind === 'mcpInvocation') {
      expect(items[0].toolDisplayName).toBe('wikipedia-mcp - list-registries');
    }
  });

  it('should include completion fields on the same item when finished', () => {
    const items = mapMcpUsageEventsToTimelineItems({
      events: [
        createEvent({
          status: McpUsageStatus.Success,
          endedAt: new Date('2026-01-01T10:00:01.200Z'),
          durationMs: 1200,
          output: 'result',
          outputTruncated: false,
        }),
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      status: 'success',
      endedAt: '2026-01-01T10:00:01.200Z',
      durationMs: 1200,
      output: 'result',
    });
  });
});
