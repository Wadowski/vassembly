import skillDomain, { toSkillResponse } from '@vassembly/domain-skill';

import type { ListSkillsBySpecializationInput, ListSkillsBySpecializationResult } from './types';

export const listSkillsBySpecialization = async (
  input: ListSkillsBySpecializationInput,
): Promise<ListSkillsBySpecializationResult> => {
  const result = await skillDomain.queries.getBySpecializationId({
    specializationId: input.specializationId,
    page: input.page,
    size: input.size,
    search: input.search,
  });

  return {
    items: result.items.map((skill) => toSkillResponse({ skill })),
    total: result.totalCount,
    page: result.page,
    size: result.size,
  };
};
