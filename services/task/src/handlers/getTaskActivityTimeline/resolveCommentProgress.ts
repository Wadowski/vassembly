import taskProgressDomain from '@vassembly/domain-task-progress';

import type { TaskProgressModel } from '@vassembly/domain-task-progress';

export interface ResolveCommentProgressParams {
  taskId: string;
  commentId: string;
  commentIndex: number;
  commentCount: number;
}

export const resolveCommentProgress = async ({
  taskId,
  commentId,
  commentIndex,
  commentCount,
}: ResolveCommentProgressParams): Promise<TaskProgressModel | null> => {
  const byCommentResult = await taskProgressDomain.queries.getModelByCommentId({ commentId });

  if (byCommentResult.data) {
    return byCommentResult.data;
  }

  const listResult = await taskProgressDomain.queries.listByTaskId({ taskId });
  const progresses = listResult.data;

  const matchingCommentProgress = progresses.find((progress) => progress.commentId === commentId);

  if (matchingCommentProgress) {
    return matchingCommentProgress;
  }

  const legacyProgresses = progresses.filter((progress) => !progress.commentId);

  if (legacyProgresses.length === 1 && commentIndex === 0) {
    return legacyProgresses[0] ?? null;
  }

  if (commentCount === 1 && progresses.length === 1) {
    return progresses[0] ?? null;
  }

  return null;
};
