import { logger } from '@vassembly/logger';

export type TaskPlanLogEvent =
  | 'taskPlan.template.created'
  | 'taskPlan.template.reused'
  | 'taskPlan.instance.created'
  | 'taskPlan.instance.itemStarted'
  | 'taskPlan.instance.itemCompleted'
  | 'taskPlan.instance.itemFailed'
  | 'taskPlan.instance.itemRetried'
  | 'taskPlan.instance.skillBackfilled'
  | 'taskPlan.instance.completed'
  | 'taskPlan.instance.failed';

export interface LogTaskPlanEventParams {
  event: TaskPlanLogEvent;
  taskId?: string;
  commentId?: string;
  userId?: string;
  taskPlanTemplateId?: string;
  taskPlanInstanceId?: string;
  templateItemIndex?: number;
  durationMs?: number;
  reason?: string;
  skillId?: string;
}

export const logTaskPlanEvent = ({
  event,
  taskId,
  commentId,
  userId,
  taskPlanTemplateId,
  taskPlanInstanceId,
  templateItemIndex,
  durationMs,
  reason,
  skillId,
}: LogTaskPlanEventParams): void => {
  logger(event, {
    meta: {
      sessionId: 'TASK_PLAN',
      ...(taskId !== undefined ? { taskId } : {}),
      ...(commentId !== undefined ? { commentId } : {}),
      ...(userId !== undefined ? { userId } : {}),
      ...(taskPlanTemplateId !== undefined ? { taskPlanTemplateId } : {}),
      ...(taskPlanInstanceId !== undefined ? { taskPlanInstanceId } : {}),
      ...(templateItemIndex !== undefined ? { templateItemIndex } : {}),
    },
    data: {
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(reason !== undefined ? { reason } : {}),
      ...(skillId !== undefined ? { skillId } : {}),
    },
  });
};
