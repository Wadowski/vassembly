import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { TaskProgressResponse, ProgressEventResponse } from './dto';
import type { TaskProgressModel, ProgressEventModel } from './model';

const REQUIRED_FIELDS = [
  'id',
  'taskId',
  'startedAt',
  'totalDuration',
  'totalTokens',
  'events',
] as const;

export interface ToTaskProgressResponseParams {
  taskProgress: TaskProgressModel;
}

const toProgressEventResponse = (
  event: ProgressEventModel & { agentName?: string },
): ProgressEventResponse => ({
  id: event.id,
  agentId: event.agentId ?? event.agentName ?? '',
  parentAgentId: event.parentAgentId,
  state: event.state,
  timestamp: toIsoString({ value: event.timestamp, fieldName: 'timestamp' }),
  duration: event.duration,
  inputMessages: event.inputMessages,
  generatedResponse: event.generatedResponse,
  tokenUsage: event.tokenUsage,
  errorDetails: event.errorDetails,
  integrationName: event.integrationName,
  provider: event.provider,
  model: event.model,
});

export const toTaskProgressResponse = ({
  taskProgress,
}: ToTaskProgressResponseParams): TaskProgressResponse => {
  assertRequiredFields({
    entity: taskProgress,
    fields: REQUIRED_FIELDS,
    entityName: 'Task progress',
  });

  return {
    id: taskProgress.id!,
    taskId: taskProgress.taskId!,
    startedAt: toIsoString({
      value: taskProgress.startedAt!,
      fieldName: 'startedAt',
    }),
    completedAt: toNullableIsoString(taskProgress.completedAt),
    totalDuration: taskProgress.totalDuration!,
    totalTokens: taskProgress.totalTokens!,
    events: (taskProgress.events || []).map(toProgressEventResponse),
  };
};
