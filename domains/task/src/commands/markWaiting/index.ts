import { TaskStatus } from '../../model';
import { conditionalStatusUpdate } from '../shared/conditionalStatusUpdate';

import type { MarkWaitingCommandInput, MarkWaitingCommandResult } from './types';

export const markWaiting = async ({
  taskId,
}: MarkWaitingCommandInput): Promise<MarkWaitingCommandResult> => {
  return conditionalStatusUpdate({
    taskId,
    filter: { status: TaskStatus.InProgress },
    update: {
      status: TaskStatus.Waiting,
    },
    conflictCode: 'TASK_NOT_WAITABLE',
    conflictMessage: 'Task is not in-progress',
  });
};
