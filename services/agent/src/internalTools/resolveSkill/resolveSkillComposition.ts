import skillDomain from '@vassembly/domain-skill';
import { ValidationError } from '@vassembly/errors';

import type { ScriptWithOwnership } from '../runSkillScript/types';

import { parseUseSkillDirectives } from './parseUseSkillDirectives';
import { resolveSkillNameToId } from './resolveSkillNameToId';
import { tagScriptsWithOwnership } from './tagScriptsWithOwnership';

const MAX_COMPOSITION_DEPTH = 3;

export interface ResolveSkillCompositionParams {
  skillId: string;
  depth?: number;
  visited?: Set<string>;
}

export interface ResolveSkillCompositionResult {
  name: string;
  rule: string;
  scripts: ScriptWithOwnership[];
}

export const resolveSkillComposition = async ({
  skillId,
  depth = 0,
  visited = new Set<string>(),
}: ResolveSkillCompositionParams): Promise<ResolveSkillCompositionResult> => {
  if (depth > MAX_COMPOSITION_DEPTH) {
    throw new ValidationError(
      `Skill composition depth limit (${MAX_COMPOSITION_DEPTH}) exceeded at skill id "${skillId}"`,
    );
  }

  if (visited.has(skillId)) {
    throw new ValidationError(`Skill composition cycle detected at skill id "${skillId}"`);
  }

  const nextVisited = new Set(visited);
  nextVisited.add(skillId);

  const activeSkill = await skillDomain.queries.getActiveRuleById({ skillId });
  const directives = parseUseSkillDirectives({ rule: activeSkill.rule });

  if (directives.length === 0) {
    return {
      name: activeSkill.name,
      rule: activeSkill.rule,
      scripts: tagScriptsWithOwnership({
        scripts: activeSkill.scripts,
        skillId: activeSkill.skillId,
        skillName: activeSkill.name,
      }),
    };
  }

  let composedRule = activeSkill.rule;
  const allScripts = tagScriptsWithOwnership({
    scripts: activeSkill.scripts,
    skillId: activeSkill.skillId,
    skillName: activeSkill.name,
  });

  for (const directive of directives) {
    try {
      const childSkillId = await resolveSkillNameToId({
        specializationId: activeSkill.specializationId,
        skillName: directive.skillName,
      });

      if (
        activeSkill.usesSkillIds.length > 0 &&
        !activeSkill.usesSkillIds.includes(childSkillId)
      ) {
        throw new ValidationError(
          `Skill "${directive.skillName}" is not declared in usesSkillIds`,
        );
      }

      const child = await resolveSkillComposition({
        skillId: childSkillId,
        depth: depth + 1,
        visited: nextVisited,
      });

      const expansion = `\n\n## Referenced skill: ${child.name}\n\n${child.rule}`;
      composedRule = composedRule.replace(directive.raw, expansion);
      allScripts.push(...child.scripts);
    } catch (error: unknown) {
      if (directive.required || error instanceof ValidationError) {
        throw error;
      }

      composedRule = composedRule.replace(
        directive.raw,
        `<!-- skill "${directive.skillName}" is not available -->`,
      );
    }
  }

  return {
    name: activeSkill.name,
    rule: composedRule,
    scripts: allScripts,
  };
};
