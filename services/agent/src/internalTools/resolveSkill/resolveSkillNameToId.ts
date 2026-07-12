import skillDomain from '@vassembly/domain-skill';

export interface ResolveSkillNameToIdParams {
  specializationId: string;
  skillName: string;
}

export const resolveSkillNameToId = async ({
  specializationId,
  skillName,
}: ResolveSkillNameToIdParams): Promise<string> => {
  const { skillId } = await skillDomain.queries.getActiveRuleByName({
    specializationId,
    skillName,
  });

  return skillId;
};
