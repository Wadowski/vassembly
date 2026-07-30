export interface TaskPlanTemplateItemResponse {
  agentId: string;
  skillId: string | null;
  description: string;
  order: number;
}

export interface TaskPlanTemplateResponse {
  id: string;
  shortName: string;
  description: string;
  inputDetails: Record<string, unknown>;
  outputDetails: Record<string, unknown>;
  items: TaskPlanTemplateItemResponse[];
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
}
