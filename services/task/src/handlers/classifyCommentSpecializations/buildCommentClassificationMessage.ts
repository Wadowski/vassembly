import taskCommentDomain from '@vassembly/domain-task-comment';

export interface BuildCommentClassificationMessageParams {
  taskId: string;
  commentId: string;
}

export const buildCommentClassificationMessage = async ({
  taskId,
  commentId,
}: BuildCommentClassificationMessageParams): Promise<string> => {
  const commentsResult = await taskCommentDomain.queries.listByTaskId({ taskId });
  const comments = commentsResult.data;

  const targetIndex = comments.findIndex((comment) => comment.id === commentId);

  if (targetIndex === -1) {
    return '';
  }

  const targetComment = comments[targetIndex]!;
  const previousComments = comments.slice(0, targetIndex);
  const segments: string[] = [];

  if (previousComments.length > 0) {
    const previousSegments: string[] = [];

    for (const comment of previousComments) {
      previousSegments.push(`User: ${comment.userText ?? ''}`);

      if (comment.agentResponse) {
        previousSegments.push(`Assistant: ${comment.agentResponse}`);
      }
    }

    segments.push('Previous comments:', previousSegments.join('\n\n'));
  }

  segments.push('New comment (classify this):', `User: ${targetComment.userText ?? ''}`);

  return segments.join('\n\n');
};
