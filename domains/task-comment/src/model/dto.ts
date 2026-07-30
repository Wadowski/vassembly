export interface TaskCommentResponse {
  id: string;
  taskId: string;
  userId: string;
  userText: string;
  agentResponse: string | null;
  specializationIds: string[];
  skillIdsUsed: string[] | null;
  taskPlanInstanceId: string | null;
  createdAt: string;
  updatedAt: string;
}
