export enum TaskExecutionMode {
  Fresh = 'fresh',
  Resume = 'resume',
  Retry = 'retry',
}

export interface ExecuteTaskParams {
  taskId: string;
  userId: string;
  commentId: string;
  mode?: TaskExecutionMode;
}

export interface CreateRecordAgentInvokeProgressParams {
  taskId: string;
  userId: string;
  commentId: string;
}
