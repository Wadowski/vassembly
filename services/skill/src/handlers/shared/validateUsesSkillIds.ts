import skillDomain from '@vassembly/domain-skill';
import { WrongParamError } from '@vassembly/errors';

import { detectCompositionCycle } from './detectCompositionCycle';

export interface ValidateUsesSkillIdsParams {
  specializationId: string;
  skillId?: string;
  usesSkillIds: string[];
}

export const validateUsesSkillIds = async ({
  specializationId,
  skillId,
  usesSkillIds,
}: ValidateUsesSkillIdsParams): Promise<void> => {
  if (usesSkillIds.length === 0) {
    return;
  }

  if (skillId !== undefined && usesSkillIds.includes(skillId)) {
    throw new WrongParamError('Skill cannot reference itself in usesSkillIds');
  }

  const { items } = await skillDomain.queries.getBySpecializationId({
    specializationId,
    size: 500,
  });

  const activeSkillIds = new Set(
    items
      .filter((skill) => skill.id && skill.enabled && skill.removedAt == null)
      .map((skill) => skill.id as string),
  );

  for (const referencedId of usesSkillIds) {
    if (!activeSkillIds.has(referencedId)) {
      throw new WrongParamError(`Referenced skill id "${referencedId}" is not active in this specialization`);
    }
  }

  const graphNodes = items
    .filter((skill): skill is typeof skill & { id: string } => typeof skill.id === 'string')
    .map((skill) => ({
      id: skill.id,
      usesSkillIds: skill.usesSkillIds,
    }));

  detectCompositionCycle({
    skillId: skillId ?? '__pending__',
    usesSkillIds,
    allSkills: graphNodes,
  });
};
