import type { TaskResponse } from '@vassembly/domain-task';

export interface PauseTaskHandlerInput {
  userId: string;
  taskId: string;
}

export interface PauseTaskHandlerOutput {
  task: TaskResponse;
}
