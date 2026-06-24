import { logger } from '@vassembly/logger';

export type SpecializationLogEvent =
  | 'specialization.create.started'
  | 'specialization.create.completed'
  | 'specialization.agent.provisioned'
  | 'specialization.agent.skipped'
  | 'specialization.agent.failed'
  | 'specialization.mcp_mapping.completed'
  | 'specialization.mcp_mapping.failed'
  | 'specialization.mcp_mapping.skipped'
  | 'specialization.agent.description.failed';

export interface LogSpecializationEventParams {
  event: SpecializationLogEvent;
  specializationId?: string;
  userId?: string;
  durationMs?: number;
  reason?: string;
  role?: string;
  agentName?: string;
  mcpCount?: number;
}

export const logSpecializationEvent = ({
  event,
  specializationId,
  userId,
  durationMs,
  reason,
  role,
  agentName,
  mcpCount,
}: LogSpecializationEventParams): void => {
  logger(event, {
    meta: {
      sessionId: 'SPECIALIZATION_PROVISIONING',
      ...(specializationId !== undefined ? { specializationId } : {}),
      ...(userId !== undefined ? { userId } : {}),
    },
    data: {
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(reason !== undefined ? { reason } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(agentName !== undefined ? { agentName } : {}),
      ...(mcpCount !== undefined ? { mcpCount } : {}),
    },
  });
};
