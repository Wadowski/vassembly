import { TaskStatus } from '../../model';
import { conditionalStatusUpdate } from '../shared/conditionalStatusUpdate';

import type {
  MarkInProgressFromWaitingCommandInput,
  MarkInProgressFromWaitingCommandResult,
} from './types';

export const markInProgressFromWaiting = async ({
  taskId,
}: MarkInProgressFromWaitingCommandInput): Promise<MarkInProgressFromWaitingCommandResult> => {
  return conditionalStatusUpdate({
    taskId,
    filter: { status: TaskStatus.Waiting },
    update: {
      status: TaskStatus.InProgress,
    },
    conflictCode: 'TASK_NOT_RESUMABLE_FROM_WAITING',
    conflictMessage: 'Task is not waiting for input',
  });
};
