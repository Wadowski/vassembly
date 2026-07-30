export interface CreateTaskPlanInstanceTemplateItem {
  agentId: string;
  skillId: string | null;
  description: string;
  order: number;
}

export interface CreateTaskPlanInstanceCommandInput {
  taskPlanTemplateId: string;
  taskId: string;
  commentId: string;
  inputDetails: Record<string, unknown>;
  templateItems: CreateTaskPlanInstanceTemplateItem[];
}

export interface CreateTaskPlanInstanceCommandResult {
  data: {
    id?: string;
    commentId?: string;
    status?: string;
    items?: Array<{ status: string; retryCount: number }>;
  };
}
