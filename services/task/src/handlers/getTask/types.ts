import type { TaskResponse } from '@vassembly/domain-task';

export interface GetTaskHandlerInput {
  userId: string;
  taskId: string;
}

export type GetTaskHandler = (input: GetTaskHandlerInput) => Promise<TaskResponse>;
