import type { InternalToolContext } from '../types';

export interface ResolveTaskIdParams {
  args: Record<string, unknown>;
  context?: InternalToolContext;
  taskId?: string;
}

export const resolveTaskId = ({ args, context, taskId }: ResolveTaskIdParams): string => {
  if (context !== undefined && context.taskId.length > 0) {
    return context.taskId;
  }

  if (typeof args.taskId === 'string' && args.taskId.length > 0) {
    return args.taskId;
  }

  if (typeof taskId === 'string' && taskId.length > 0) {
    return taskId;
  }

  if (typeof args.id === 'string' && args.id.length > 0) {
    return args.id;
  }

  return '';
};
