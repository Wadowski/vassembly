import taskCommentDomain from '@vassembly/domain-task-comment';
import taskDomain from '@vassembly/domain-task';

export interface AggregateTaskSpecializationIdsParams {
  taskId: string;
}

export const aggregateTaskSpecializationIds = async ({
  taskId,
}: AggregateTaskSpecializationIdsParams): Promise<void> => {
  const [taskResult, commentsResult] = await Promise.all([
    taskDomain.queries.getModelById({ id: taskId }),
    taskCommentDomain.queries.listByTaskId({ taskId }),
  ]);

  const task = taskResult.data;

  if (!task) {
    return;
  }

  const commentSpecializationIds = commentsResult.data.flatMap(
    (comment) => comment.specializationIds ?? [],
  );
  const existingTaskIds = task.specializationIds ?? [];
  const specializationIds = [
    ...new Set([...existingTaskIds, ...commentSpecializationIds]),
  ];

  await taskDomain.commands.updateTask({
    id: taskId,
    specializationIds,
  });
};
