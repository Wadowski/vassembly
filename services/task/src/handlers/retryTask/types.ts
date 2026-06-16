import type { TaskResponse } from '@vassembly/domain-task';

export interface RetryTaskHandlerInput {
  userId: string;
  taskId: string;
}

export interface RetryTaskHandlerOutput {
  task: TaskResponse;
}
