import { toIsoString } from '@vassembly/mappers';

import { McpUsageStatus } from '@vassembly/domain-mcp-usage';

import type { McpUsageEventModel } from '@vassembly/domain-mcp-usage';
import type { TaskActivityItem } from './types';

export interface MapMcpUsageEventsToTimelineItemsParams {
  events: McpUsageEventModel[];
}

const resolveMcpDisplayName = ({ event }: { event: McpUsageEventModel }): string => {
  return event.mcpSlug ?? event.mcpId;
};

export const mapMcpUsageEventsToTimelineItems = ({
  events,
}: MapMcpUsageEventsToTimelineItemsParams): TaskActivityItem[] => {
  const items: TaskActivityItem[] = [];

  for (const event of events) {
    const eventId = event.id!;
    const mcpName = resolveMcpDisplayName({ event });
    const commentId = event.commentId ?? '';

    items.push({
      kind: 'mcpInvocationStarted',
      id: `mcp-start-${eventId}`,
      occurredAt: toIsoString({ value: event.startedAt, fieldName: 'startedAt' }),
      sortKey: `${eventId}-start`,
      filterGroup: 'mcpUsage',
      commentId,
      usageEventId: eventId,
      mcpId: event.mcpId,
      mcpName,
      toolName: event.toolName,
      agentId: event.agentId,
    });

    if (event.status !== McpUsageStatus.InProgress && event.endedAt) {
      items.push({
        kind: 'mcpInvocationCompleted',
        id: `mcp-complete-${eventId}`,
        occurredAt: toIsoString({ value: event.endedAt, fieldName: 'endedAt' }),
        sortKey: `${eventId}-complete`,
        filterGroup: 'mcpUsage',
        commentId,
        usageEventId: eventId,
        mcpId: event.mcpId,
        mcpName,
        toolName: event.toolName,
        agentId: event.agentId,
        status: event.status,
        durationMs: event.durationMs ?? undefined,
        errorMessage: event.errorMessage ?? undefined,
      });
    }
  }

  return items;
};
