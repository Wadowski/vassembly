export interface MarkInProgressFromWaitingCommandInput {
  taskId: string;
}

export interface MarkInProgressFromWaitingCommandResult {
  data: import('../../model').TaskModel;
}
