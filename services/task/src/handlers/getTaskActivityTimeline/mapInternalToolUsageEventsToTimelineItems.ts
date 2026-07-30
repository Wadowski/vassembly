import { toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { InternalToolUsageEventModel } from '@vassembly/domain-internal-tool-usage';
import type { TaskActivityItem } from './types';
import { serializeToolPayload } from './serializeToolPayload';

export interface MapInternalToolUsageEventsToTimelineItemsParams {
  events: InternalToolUsageEventModel[];
}

const resolveInternalToolDisplayName = ({
  event,
}: {
  event: InternalToolUsageEventModel;
}): string => {
  return event.internalToolDisplayName ?? event.internalToolId;
};

export const mapInternalToolUsageEventsToTimelineItems = ({
  events,
}: MapInternalToolUsageEventsToTimelineItemsParams): TaskActivityItem[] => {
  return events.map((event) => {
    const eventId = event.id!;
    const startedAt = toIsoString({ value: event.startedAt, fieldName: 'startedAt' });

    return {
      kind: 'toolInvocation',
      id: `tool-${eventId}`,
      occurredAt: startedAt,
      sortKey: eventId,
      filterGroup: 'toolCalls',
      commentId: event.commentId ?? '',
      usageEventId: eventId,
      internalToolId: event.internalToolId,
      internalToolDisplayName: resolveInternalToolDisplayName({ event }),
      toolName: event.toolName,
      agentId: event.agentId,
      status: event.status,
      startedAt,
      endedAt: toNullableIsoString(event.endedAt) ?? undefined,
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
