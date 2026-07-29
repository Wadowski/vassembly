export interface OrchestrateTaskPlanInstanceParams {
  taskPlanInstanceId: string;
  commentId: string;
  taskId: string;
}

export interface OrchestrateTaskPlanInstanceResult {
  instanceStatus: 'pending' | 'in-progress' | 'done' | 'failed';
  skillIdsUsed: string[];
  executedItemIndexes: number[];
}
