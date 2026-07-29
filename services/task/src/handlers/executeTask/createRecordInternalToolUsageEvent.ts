import { getInternalToolById } from '@vassembly/constants';
import internalToolUsageDomain, {
  InternalToolUsageStatus,
} from '@vassembly/domain-internal-tool-usage';

import type { RecordInternalToolUsageEventInput } from '@vassembly/service-agent';
import type { CreateRecordInternalToolUsageEventParams } from './types';

export const createRecordInternalToolUsageEvent = ({
  taskId,
  userId,
  commentId,
}: CreateRecordInternalToolUsageEventParams) => {
  return async (input: RecordInternalToolUsageEventInput): Promise<string | void> => {
    if (input.phase === 'started') {
      const toolDefinition = getInternalToolById(input.internalToolId);
      const internalToolDisplayName = toolDefinition?.displayName ?? undefined;

      const result = await internalToolUsageDomain.commands.recordUsageEvent({
        phase: 'started',
        internalToolId: input.internalToolId,
        internalToolDisplayName,
        toolName: input.toolName,
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

    await internalToolUsageDomain.commands.recordUsageEvent({
      phase: 'completed',
      eventId: input.eventId,
      status:
        input.status === 'success' ? InternalToolUsageStatus.Success : InternalToolUsageStatus.Error,
      endedAt: input.endedAt,
      durationMs: input.durationMs,
      errorMessage: input.errorMessage,
      output: input.output,
    });
  };
};
