import { logger } from '@vassembly/logger';

export type TaskTitleLogEvent =
  | 'task.title.started'
  | 'task.title.completed'
  | 'task.title.failed'
  | 'task.title.skipped';

export interface LogTaskTitleEventParams {
  event: TaskTitleLogEvent;
  taskId: string;
  userId: string;
  durationMs?: number;
  reason?: string;
}

export const logTaskTitleEvent = ({
  event,
  taskId,
  userId,
  durationMs,
  reason,
}: LogTaskTitleEventParams): void => {
  logger(event, {
    meta: { sessionId: 'TASK_TITLE_GENERATION', taskId, userId },
    data: {
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(reason !== undefined ? { reason } : {}),
    },
  });
};
