import { logger } from '@vassembly/logger';

export interface LogTaskTransitionParams {
  event: 'task.status.done' | 'task.status.failed' | 'task.execution.paused';
  taskId: string;
  userId: string;
  durationMs: number;
  errorCode?: string;
  provider?: string;
  model?: string;
}

export const logTaskTransition = ({
  event,
  taskId,
  userId,
  durationMs,
  errorCode,
  provider,
  model,
}: LogTaskTransitionParams): void => {
  logger(event, {
    meta: { sessionId: 'TASK_EXECUTION', taskId, userId },
    data: {
      durationMs,
      ...(errorCode !== undefined ? { errorCode } : {}),
      ...(provider !== undefined ? { provider } : {}),
      ...(model !== undefined ? { model } : {}),
    },
  });
};
