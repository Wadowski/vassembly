import skillDomain from '@vassembly/domain-skill';
import { ValidationError } from '@vassembly/errors';

export interface ResolvePlanItemSkillIdsItem {
  skillId: string | null;
  skillName?: string | null;
  description: string;
}

export interface ResolvePlanItemSkillIdsParams {
  items: ResolvePlanItemSkillIdsItem[];
  specializationIds: string[];
}

export interface ResolvedPlanItemSkill {
  skillId: string | null;
  description: string;
}

const resolveSkillIdByName = async ({
  skillName,
  specializationIds,
}: {
  skillName: string;
  specializationIds: string[];
}): Promise<string | null> => {
  for (const specializationId of specializationIds) {
    try {
      const skillResult = await skillDomain.queries.getActiveRuleByName({
        specializationId,
        skillName,
      });

      return skillResult.skillId;
    } catch {
      continue;
    }
  }

  return null;
};

export const resolvePlanItemSkillIds = async ({
  items,
  specializationIds,
}: ResolvePlanItemSkillIdsParams): Promise<ResolvedPlanItemSkill[]> => {
  return Promise.all(
    items.map(async (item) => {
      if (item.skillId !== null) {
        return {
          skillId: item.skillId,
          description: item.description,
        };
      }

      const skillName = item.skillName?.trim();

      if (skillName) {
        const resolvedSkillId = await resolveSkillIdByName({ skillName, specializationIds });

        if (resolvedSkillId === null) {
          throw new ValidationError(
            `Unknown skillName "${skillName}" — no matching skill found for this task's specializations`,
          );
        }

        return {
          skillId: resolvedSkillId,
          description: item.description,
        };
      }

      if (item.description.trim().length === 0) {
        throw new ValidationError(
          'Each plan item must reference an existing skill (skillName) or define a new reusable skill in description',
        );
      }

      return {
        skillId: null,
        description: item.description,
      };
    }),
  );
};
