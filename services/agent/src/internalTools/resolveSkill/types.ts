import type { RunSkillScriptToolResult } from '../runSkillScript/types';

export interface ResolveSkillToolResult {
  skillName: string;
  rule: string;
  autoRunResults?: RunSkillScriptToolResult[];
}
