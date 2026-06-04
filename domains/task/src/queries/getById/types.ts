import type { TaskResponse } from '../../model';

export interface GetByIdInput {
  id: string;
  userId: string;
}

export type GetByIdHandler = (input: GetByIdInput) => Promise<{ data: TaskResponse }>;
