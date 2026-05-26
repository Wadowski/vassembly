import { TaskStatus, TaskType } from './model';

export interface TaskResponse {
  id: string;
  userId: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  agentAssignedId: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}
