import { logger } from '@vassembly/logger';

export type ClassificationLogEvent =
  | 'specialization.classification.started'
  | 'specialization.classification.completed'
  | 'specialization.classification.skipped';

export interface LogClassificationEventParams {
  event: ClassificationLogEvent;
  taskId: string;
  userId: string;
  durationMs?: number;
  reason?: string;
}

export const logClassificationEvent = ({
  event,
  taskId,
  userId,
  durationMs,
  reason,
}: LogClassificationEventParams): void => {
  logger(event, {
    meta: { sessionId: 'SPECIALIZATION_CLASSIFICATION', taskId, userId },
    data: {
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(reason !== undefined ? { reason } : {}),
    },
  });
};
