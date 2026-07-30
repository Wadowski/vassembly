import skillDomain from '@vassembly/domain-skill';

export interface ResolveSkillDisplayNamesParams {
  skillIds: string[];
}

export const resolveSkillDisplayNames = async ({
  skillIds,
}: ResolveSkillDisplayNamesParams): Promise<Map<string, string>> => {
  const uniqueSkillIds = [...new Set(skillIds.filter((skillId) => skillId.length > 0))];
  const entries = await Promise.all(
    uniqueSkillIds.map(async (skillId) => {
      try {
        const skillResult = await skillDomain.queries.getById({ id: skillId });
        return [skillId, skillResult.data.name] as const;
      } catch {
        return [skillId, null] as const;
      }
    }),
  );

  const nameMap = new Map<string, string>();

  for (const [skillId, name] of entries) {
    if (name) {
      nameMap.set(skillId, name);
    }
  }

  return nameMap;
};
