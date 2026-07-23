import taskCommentDomain from '@vassembly/domain-task-comment';
import taskDomain from '@vassembly/domain-task';

export interface ResolveActiveCommentIdParams {
  taskId: string;
}

export const resolveActiveCommentId = async ({
  taskId,
}: ResolveActiveCommentIdParams): Promise<string> => {
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });
  const activeCommentId = taskResult.data?.activeCommentId;

  if (activeCommentId) {
    return activeCommentId;
  }

  const commentsResult = await taskCommentDomain.queries.listByTaskId({ taskId });
  const comments = commentsResult.data;

  const openComment = [...comments].reverse().find((comment) => !comment.agentResponse);

  if (!openComment?.id) {
    throw new Error(`No active comment for task ${taskId}`);
  }

  return openComment.id;
};
