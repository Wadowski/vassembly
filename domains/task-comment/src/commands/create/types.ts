export interface CreateTaskCommentCommandInput {
  taskId: string;
  userId: string;
  userText: string;
}

export interface CreateTaskCommentCommandResult {
  data: import('../../model').TaskCommentModel;
}
