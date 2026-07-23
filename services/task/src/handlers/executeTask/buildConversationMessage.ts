import taskCommentDomain from '@vassembly/domain-task-comment';

export interface BuildConversationMessageParams {
  taskId: string;
}

export const buildConversationMessage = async ({
  taskId,
}: BuildConversationMessageParams): Promise<string> => {
  const commentsResult = await taskCommentDomain.queries.listByTaskId({ taskId });
  const comments = commentsResult.data;

  if (comments.length === 0) {
    return '';
  }

  const segments: string[] = [];

  for (const comment of comments) {
    segments.push(`User: ${comment.userText ?? ''}`);

    if (comment.agentResponse) {
      segments.push(`Assistant: ${comment.agentResponse}`);
    }
  }

  return segments.join('\n\n');
};
