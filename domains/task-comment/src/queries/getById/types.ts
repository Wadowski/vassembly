import type { TaskCommentResponse } from '../../model';

export interface GetByIdInput {
  id: string;
  userId: string;
}

export interface GetByIdResult {
  data: TaskCommentResponse;
}

export type GetByIdHandler = (input: GetByIdInput) => Promise<GetByIdResult>;
