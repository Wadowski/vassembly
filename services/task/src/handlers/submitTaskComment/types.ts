export interface SubmitTaskCommentHandlerInput {
  userId: string;
  taskId: string;
  userText: string;
}

import type { TaskCommentResponse } from '@vassembly/domain-task-comment';
import type { TaskResponse } from '@vassembly/domain-task';

export interface SubmitTaskCommentHandlerOutput {
  comment: TaskCommentResponse;
  task: TaskResponse;
}
