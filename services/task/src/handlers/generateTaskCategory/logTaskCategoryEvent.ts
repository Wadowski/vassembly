import { logger } from '@vassembly/logger';

export type TaskCategoryLogEvent =
  | 'task.category.started'
  | 'task.category.completed'
  | 'task.category.failed'
  | 'task.category.skipped';

export interface LogTaskCategoryEventParams {
  event: TaskCategoryLogEvent;
  taskId: string;
  userId: string;
  durationMs?: number;
  reason?: string;
}

export const logTaskCategoryEvent = ({
  event,
  taskId,
  userId,
  durationMs,
  reason,
}: LogTaskCategoryEventParams): void => {
  logger(event, {
    meta: { sessionId: 'TASK_CATEGORY_GENERATION', taskId, userId },
    data: {
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(reason !== undefined ? { reason } : {}),
    },
  });
};
