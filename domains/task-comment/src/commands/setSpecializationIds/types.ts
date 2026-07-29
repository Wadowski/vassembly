import type { TaskCommentModel } from '../../model';

export interface SetSpecializationIdsCommandInput {
  commentId: string;
  specializationIds: string[];
}

export interface SetSpecializationIdsCommandResult {
  data: TaskCommentModel;
}
