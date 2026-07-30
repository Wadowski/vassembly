import type { TaskPlanInstanceModel } from '../../model';

export interface GetByCommentIdParams {
  commentId: string;
}

export interface GetByCommentIdResult {
  data: TaskPlanInstanceModel | null;
}
