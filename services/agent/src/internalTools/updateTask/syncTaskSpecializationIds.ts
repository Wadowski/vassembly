import taskDomain from '@vassembly/domain-task';

import { resolveTaskId } from './resolveTaskId';

import type { InternalToolContext } from '../types';

export interface SyncTaskSpecializationIdsParams {
  taskId: string;
  specializationIds: string[];
  context?: InternalToolContext;
}

export const syncTaskSpecializationIds = async ({
  taskId,
  specializationIds,
  context,
}: SyncTaskSpecializationIdsParams): Promise<void> => {
  const resolvedTaskId = resolveTaskId({ args: {}, context, taskId });

  await taskDomain.commands.updateTask({
    id: resolvedTaskId,
    specializationIds,
  });

  if (context !== undefined) {
    context.specializationIds = specializationIds;
  }
};
