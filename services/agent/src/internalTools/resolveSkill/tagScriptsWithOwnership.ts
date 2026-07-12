import type { SkillScript } from '@vassembly/domain-skill';

import type { ScriptWithOwnership } from '../runSkillScript/types';

export interface TagScriptsWithOwnershipParams {
  scripts: SkillScript[];
  skillId: string;
  skillName: string;
}

export const tagScriptsWithOwnership = ({
  scripts,
  skillId,
  skillName,
}: TagScriptsWithOwnershipParams): ScriptWithOwnership[] =>
  scripts.map((script) => ({
    ...script,
    skillId,
    skillName,
  }));
