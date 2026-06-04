import type { TaskResponse } from '@vassembly/domain-task';

export interface CreateTaskHandlerInput {
  userId: string;
  body: {
    description: string;
  };
}

export interface CreateTaskHandlerOutput {
  task: TaskResponse;
}
