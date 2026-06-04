import { TaskStatus, TaskType } from './model';

export interface TaskResponse {
  id: string;
  userId: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  agentAssignedId: string | null;
  title: string | null;
  llmResponse: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
