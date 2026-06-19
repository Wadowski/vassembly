import type { TaskResponse } from '@vassembly/domain-task';

export interface ResumeTaskHandlerInput {
  userId: string;
  taskId: string;
}

export interface ResumeTaskHandlerOutput {
  task: TaskResponse;
}
