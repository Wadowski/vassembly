import { toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { McpUsageEventModel } from '@vassembly/domain-mcp-usage';
import type { TaskActivityItem } from './types';
import { serializeToolPayload } from './serializeToolPayload';

export interface MapMcpUsageEventsToTimelineItemsParams {
  events: McpUsageEventModel[];
}

const resolveMcpDisplayName = ({ event }: { event: McpUsageEventModel }): string => {
  return event.mcpSlug ?? event.mcpId;
};

export const mapMcpUsageEventsToTimelineItems = ({
  events,
}: MapMcpUsageEventsToTimelineItemsParams): TaskActivityItem[] => {
  return events.map((event) => {
    const eventId = event.id!;
    const startedAt = toIsoString({ value: event.startedAt, fieldName: 'startedAt' });

    return {
      kind: 'mcpInvocation',
      id: `mcp-${eventId}`,
      occurredAt: startedAt,
      sortKey: eventId,
      filterGroup: 'toolCalls',
      commentId: event.commentId ?? '',
      usageEventId: eventId,
      mcpId: event.mcpId,
      mcpName: resolveMcpDisplayName({ event }),
      toolName: event.toolName,
      toolDisplayName: event.toolDisplayName ?? undefined,
      agentId: event.agentId,
      status: event.status,
      startedAt,
      endedAt: toNullableIsoString(event.endedAt),
      durationMs: event.durationMs ?? undefined,
      errorMessage: event.errorMessage ?? undefined,
      input: serializeToolPayload({ payload: event.input }),
      inputTruncated: event.inputTruncated,
      output: event.output ?? undefined,
      outputTruncated: event.outputTruncated,
      invocationId: event.invocationId ?? undefined,
      rootInvokeId: event.rootInvokeId ?? undefined,
    };
  });
};
