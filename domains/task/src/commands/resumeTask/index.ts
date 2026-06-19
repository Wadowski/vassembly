import { TaskStatus } from '../../model';
import { conditionalStatusUpdate } from '../shared/conditionalStatusUpdate';

import type { ResumeTaskCommandInput, ResumeTaskCommandResult } from './types';

export const resumeTask = async ({
  taskId,
}: ResumeTaskCommandInput): Promise<ResumeTaskCommandResult> => {
  return conditionalStatusUpdate({
    taskId,
    filter: { status: TaskStatus.Paused },
    update: {
      status: TaskStatus.InProgress,
    },
    conflictCode: 'TASK_NOT_RESUMABLE',
    conflictMessage: 'Task is not paused',
  });
};
