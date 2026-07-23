import type { SubmitTaskCommentResponse } from '@vassembly/ui-api-hooks';
import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';

export interface MapSubmittedCommentToActivityItemParams {
  comment: SubmitTaskCommentResponse['comment'];
}

export const mapSubmittedCommentToActivityItem = ({
  comment,
}: MapSubmittedCommentToActivityItemParams): TaskActivityItemDto => {
  return {
    kind: 'userComment',
    id: `user-comment-${comment.id}`,
    occurredAt: comment.createdAt,
    sortKey: comment.id,
    filterGroup: 'comments',
    commentId: comment.id,
    userText: comment.userText,
  };
};
