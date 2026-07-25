import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { McpUsageEventResponse } from './dto';
import type { McpUsageEventModel } from './model';

const REQUIRED_FIELDS = [
  'id',
  'mcpId',
  'toolName',
  'userId',
  'agentId',
  'status',
  'startedAt',
  'createdAt',
  'updatedAt',
] as const;

export interface ToMcpUsageEventResponseParams {
  event: McpUsageEventModel;
}

export const toMcpUsageEventResponse = ({
  event,
}: ToMcpUsageEventResponseParams): McpUsageEventResponse => {
  assertRequiredFields({
    entity: event,
    fields: REQUIRED_FIELDS,
    entityName: 'MCP usage event',
  });

  return {
    id: event.id!,
    mcpId: event.mcpId!,
    mcpSlug: event.mcpSlug ?? null,
    toolName: event.toolName!,
    userId: event.userId!,
    taskId: event.taskId ?? null,
    commentId: event.commentId ?? null,
    agentId: event.agentId!,
    invocationId: event.invocationId ?? null,
    rootInvokeId: event.rootInvokeId ?? null,
    status: event.status!,
    startedAt: toIsoString({ value: event.startedAt!, fieldName: 'startedAt' }),
    endedAt: toNullableIsoString(event.endedAt),
    durationMs: event.durationMs ?? null,
    input: event.input ?? null,
    inputTruncated: event.inputTruncated ?? false,
    errorMessage: event.errorMessage ?? null,
    createdAt: toIsoString({ value: event.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: event.updatedAt!, fieldName: 'updatedAt' }),
  };
};
