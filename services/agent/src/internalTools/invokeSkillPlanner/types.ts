export interface InvokeSkillPlannerToolResult {
  skillId: string;
  skillName: string;
  isNew: boolean;
  specializationId: string;
}

export interface BuildSkillPlannerMessageParams {
  specializationName: string;
  specializationId: string;
  goal: string;
  mcpItems: Array<{ slug: string; name: string; description: string }>;
  skillsCatalogSection?: string;
}

export interface ParseSkillPlannerResultParams {
  message: string;
}

export interface ParsedCreateSkillResult {
  skillId: string;
  isNew: boolean;
}
