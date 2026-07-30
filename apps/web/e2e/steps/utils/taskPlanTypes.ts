export type TaskPlanItemStatus = 'pending' | 'in-progress' | 'done' | 'failed';

export interface TaskPlanSeedItem {
  order: number;
  agentName: string;
  skillName: string | null;
  description: string;
  status: TaskPlanItemStatus;
}

export interface SeedTaskPlanCommentParams {
  shortName: string;
  items: TaskPlanSeedItem[];
  skillNames: string[];
  agentResponse?: string | null;
  userText?: string;
}

export interface SeedTaskPlanCommentResult {
  taskId: string;
  commentId: string;
  taskPlanInstanceId: string;
  specializationId: string;
  skillIdsByName: Record<string, string>;
}
