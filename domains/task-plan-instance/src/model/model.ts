import { Model } from '@vassembly/model';

export enum TaskPlanInstanceStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Done = 'done',
  Failed = 'failed',
}

export interface TaskPlanInstanceItem {
  templateItemIndex: number;
  agentId: string;
  skillId: string | null;
  order: number;
  status: TaskPlanInstanceStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  retryCount: number;
}

export class TaskPlanInstanceModel extends Model {
  taskPlanTemplateId?: string;
  taskId?: string;
  commentId?: string;
  inputDetails?: Record<string, unknown>;
  status?: TaskPlanInstanceStatus;
  items?: TaskPlanInstanceItem[];
  startedAt?: Date | null;
  completedAt?: Date | null;
  failedAt?: Date | null;
}
