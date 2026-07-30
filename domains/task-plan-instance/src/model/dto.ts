import type { TaskPlanInstanceStatus } from './model';

export interface TaskPlanInstanceItemResponse {
  templateItemIndex: number;
  agentId: string;
  skillId: string | null;
  order: number;
  status: TaskPlanInstanceStatus;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  retryCount: number;
}

export interface TaskPlanInstanceResponse {
  id: string;
  taskPlanTemplateId: string;
  taskId: string;
  commentId: string;
  inputDetails: Record<string, unknown>;
  status: TaskPlanInstanceStatus;
  items: TaskPlanInstanceItemResponse[];
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
}
