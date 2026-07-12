import type { SkillScript } from '@vassembly/domain-skill';

export interface RunSkillScriptToolResult {
  skillName: string;
  filename: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  truncated: boolean;
}

export interface ScriptWithOwnership extends SkillScript {
  skillId: string;
  skillName: string;
}

export interface ParseRuleDirectivesParams {
  rule: string;
  skillName: string;
  scripts: ScriptWithOwnership[];
}

export interface RuleDirectiveMatch {
  skillName: string;
  filename: string;
  skillId: string;
}

export interface RunSkillScriptHandlerParams {
  skillName: string;
  filename: string;
  skillId?: string;
  specializationId?: string;
  input?: Record<string, unknown>;
  env?: Record<string, string>;
  args?: string[];
}
