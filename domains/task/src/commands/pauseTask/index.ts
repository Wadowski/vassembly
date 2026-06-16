import { TaskStatus } from '../../model';
import { conditionalStatusUpdate } from '../shared/conditionalStatusUpdate';

import type { PauseTaskCommandInput, PauseTaskCommandResult } from './types';

export const pauseTask = async ({
  taskId,
}: PauseTaskCommandInput): Promise<PauseTaskCommandResult> => {
  return conditionalStatusUpdate({
    taskId,
    filter: { status: TaskStatus.InProgress },
    update: {
      status: TaskStatus.Paused,
      pausedAt: new Date(),
    },
    conflictCode: 'TASK_NOT_PAUSABLE',
    conflictMessage: 'Task is not in-progress',
  });
};
