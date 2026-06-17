export interface MarkWaitingCommandInput {
  taskId: string;
}

export interface MarkWaitingCommandResult {
  data: import('../../model').TaskModel;
}
