import type { TaskPlanInstanceStatus } from '../../model';

export interface RetryItemCommandInput {
  id: string;
  templateItemIndex: number;
}

export interface RetryItemCommandResult {
  data: {
    status?: TaskPlanInstanceStatus;
    items?: Array<{
      status: TaskPlanInstanceStatus;
      retryCount: number;
      completedAt?: Date | null;
      failedAt?: Date | null;
      errorMessage?: string | null;
    }>;
  };
}
