import type { RunSkillScriptToolResult } from '../runSkillScript/types';

export interface ResolveSkillToolSuccessResult {
  skillName: string;
  rule: string;
  autoRunResults?: RunSkillScriptToolResult[];
}

export interface ResolveSkillToolNotFoundResult {
  error: 'skill_not_found';
  skillName: string;
  message: string;
}

export type ResolveSkillToolResult =
  | ResolveSkillToolSuccessResult
  | ResolveSkillToolNotFoundResult;
