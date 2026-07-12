import skillDomain from '@vassembly/domain-skill';
import { NotFoundError } from '@vassembly/errors';

import type { GetActiveRuleByNameResult } from '@vassembly/domain-skill';

import { resolveSpecializationId } from './resolveSpecializationId';

import type { InternalToolContext } from '../types';

export interface ResolveActiveSkillParams {
  skillName: string;
  specializationIdArg?: string;
  context: InternalToolContext;
}

export const resolveActiveSkill = async ({
  skillName,
  specializationIdArg,
  context,
}: ResolveActiveSkillParams): Promise<GetActiveRuleByNameResult> => {
  const normalizedSkillName = skillName.trim();

  if (specializationIdArg?.trim()) {
    return skillDomain.queries.getActiveRuleByName({
      specializationId: specializationIdArg.trim(),
      skillName: normalizedSkillName,
    });
  }

  const specializationIdFromAgent = await resolveSpecializationId({
    specializationIdArg,
    context,
  });

  if (specializationIdFromAgent) {
    return skillDomain.queries.getActiveRuleByName({
      specializationId: specializationIdFromAgent,
      skillName: normalizedSkillName,
    });
  }

  const contextSpecializationIds =
    context.specializationIds?.filter(
      (id): id is string => typeof id === 'string' && id.trim().length > 0,
    ) ?? [];

  if (contextSpecializationIds.length > 1) {
    for (const specializationId of contextSpecializationIds) {
      try {
        return await skillDomain.queries.getActiveRuleByName({
          specializationId,
          skillName: normalizedSkillName,
        });
      } catch (error) {
        if (!(error instanceof NotFoundError)) {
          throw error;
        }
      }
    }

    throw new NotFoundError(`Skill "${normalizedSkillName}" not found or not active`);
  }

  const fallbackSpecializationId = contextSpecializationIds[0] ?? '';

  if (!fallbackSpecializationId) {
    throw new NotFoundError(`Skill "${normalizedSkillName}" not found or not active`);
  }

  return skillDomain.queries.getActiveRuleByName({
    specializationId: fallbackSpecializationId,
    skillName: normalizedSkillName,
  });
};
