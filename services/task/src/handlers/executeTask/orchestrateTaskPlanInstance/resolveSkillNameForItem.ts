import skillDomain from '@vassembly/domain-skill';

export interface ResolveSkillNameForItemParams {
  skillId: string | null;
}

export const resolveSkillNameForItem = async ({
  skillId,
}: ResolveSkillNameForItemParams): Promise<string | null> => {
  if (skillId === null) {
    return null;
  }

  const skillResult = await skillDomain.queries.getModelById({ id: skillId });

  return skillResult.data?.name ?? null;
};
