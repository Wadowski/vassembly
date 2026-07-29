import type { TaskPlanInstanceStatus } from '../../model';

export interface UpdateItemStatusCommandInput {
  id: string;
  templateItemIndex: number;
  status: TaskPlanInstanceStatus;
  output?: Record<string, unknown>;
  errorMessage?: string;
}

export interface UpdateItemStatusCommandResult {
  data: {
    status?: TaskPlanInstanceStatus;
    items?: Array<{
      status: TaskPlanInstanceStatus;
      startedAt?: Date | null;
      completedAt?: Date | null;
      failedAt?: Date | null;
      errorMessage?: string | null;
    }>;
  };
}
