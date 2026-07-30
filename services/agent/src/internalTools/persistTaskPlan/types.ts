export interface PersistTaskPlanInput {
  shortName: string;
  description: string;
  inputDetails: Record<string, unknown>;
  outputDetails: Record<string, unknown>;
  resolvedInputDetails: Record<string, unknown>;
  items: Array<{
    agentName: string;
    skillId: string | null;
    skillName?: string | null;
    description: string;
    order: number;
  }>;
}

export interface PersistTaskPlanResult {
  taskPlanTemplateId: string;
  taskPlanInstanceId: string;
  reusedExistingTemplate: boolean;
}
