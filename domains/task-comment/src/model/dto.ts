export interface TaskCommentResponse {
  id: string;
  taskId: string;
  userId: string;
  userText: string;
  agentResponse: string | null;
  createdAt: string;
  updatedAt: string;
}
