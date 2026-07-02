export interface RunSkillScriptToolResult {
  skillName: string;
  filename: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  truncated: boolean;
}

export interface ParseRuleDirectivesParams {
  rule: string;
  skillName: string;
  scripts: Array<{ filename: string }>;
}

export interface RuleDirectiveMatch {
  skillName: string;
  filename: string;
}

export interface RunSkillScriptHandlerParams {
  skillName: string;
  filename: string;
  specializationId?: string;
  input?: Record<string, unknown>;
  env?: Record<string, string>;
  args?: string[];
}
