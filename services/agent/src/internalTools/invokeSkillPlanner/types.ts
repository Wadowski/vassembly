export interface InvokeSkillPlannerToolResult {
  skillId: string;
  skillName: string;
  isNew: boolean;
  specializationId: string;
  action: 'create' | 'reuse' | 'compose';
  composedSkillNames?: string[];
  refinements?: string;
}

export interface BuildSkillPlannerMessageParams {
  specializationName: string;
  specializationId: string;
  goal: string;
  mcpItems: Array<{ slug: string; name: string; description: string }>;
  skillsCatalogSection?: string;
  similarSkillsSection?: string;
}

export interface ParseSkillPlannerResultParams {
  message: string;
}

export interface ParsedCreateSkillResult {
  action: 'create';
  skillId: string;
  isNew: boolean;
}

export interface ParsedReuseSkillResult {
  action: 'reuse';
  skillName: string;
  fitScore?: number;
  refinements?: string;
}

export interface ParsedComposeSkillResult {
  action: 'compose';
  skillNames: string[];
  fitScore?: number;
}

export type ParsedSkillPlannerResult =
  | ParsedCreateSkillResult
  | ParsedReuseSkillResult
  | ParsedComposeSkillResult;
