import taskDomain, { TaskStatus, toTaskResponse } from '@vassembly/domain-task';
import { ConflictError, NotFoundError } from '@vassembly/errors';

import { executionRegistry } from '../../executionRegistry';

import type { PauseTaskHandlerInput, PauseTaskHandlerOutput } from './types';

export const pauseTask = async ({
  userId,
  taskId,
}: PauseTaskHandlerInput): Promise<PauseTaskHandlerOutput> => {
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });
  const task = taskResult.data;

  if (task.userId !== userId) {
    throw new NotFoundError('Task not found');
  }

  if (task.status === TaskStatus.Paused) {
    return {
      task: toTaskResponse({ task }),
    };
  }

  if (task.status !== TaskStatus.InProgress) {
    throw new ConflictError('Task is not in-progress', { code: 'TASK_NOT_PAUSABLE' });
  }

  executionRegistry.abort({ taskId });

  const result = await taskDomain.commands.pauseTask({ taskId });

  return {
    task: toTaskResponse({ task: result.data }),
  };
};
