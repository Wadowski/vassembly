import mcpDomain from '@vassembly/domain-mcp';
import mcpUsageDomain, { McpUsageStatus } from '@vassembly/domain-mcp-usage';
import { formatToolDisplayName } from '@vassembly/constants';

import type { RecordMcpUsageEventInput } from '@vassembly/service-agent';
import type { CreateRecordMcpUsageEventParams } from './types';

export const createRecordMcpUsageEvent = ({
  taskId,
  userId,
  commentId,
}: CreateRecordMcpUsageEventParams) => {
  return async (input: RecordMcpUsageEventInput): Promise<string | void> => {
    if (input.phase === 'started') {
      const mcpResult = await mcpDomain.queries.getModelById({ id: input.mcpId });
      const mcpSlug = mcpResult.data?.slug ?? undefined;
      const toolDisplayName = formatToolDisplayName({
        domain: mcpSlug ?? input.mcpId,
        action: input.originalToolName,
      });

      const result = await mcpUsageDomain.commands.recordUsageEvent({
        phase: 'started',
        mcpId: input.mcpId,
        mcpSlug,
        toolName: input.toolName,
        toolDisplayName,
        userId,
        taskId,
        commentId,
        agentId: input.agentId ?? '',
        invocationId: input.invocationId,
        rootInvokeId: input.rootInvokeId,
        startedAt: input.startedAt,
        input: input.args,
      });

      if (result && typeof result === 'object' && 'eventId' in result) {
        return result.eventId;
      }

      return undefined;
    }

    await mcpUsageDomain.commands.recordUsageEvent({
      phase: 'completed',
      eventId: input.eventId,
      status:
        input.status === 'success' ? McpUsageStatus.Success : McpUsageStatus.Error,
      endedAt: input.endedAt,
      durationMs: input.durationMs,
      errorMessage: input.errorMessage,
      output: input.output,
    });
  };
};
