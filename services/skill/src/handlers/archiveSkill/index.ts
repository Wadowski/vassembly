import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import skillDomain, { toSkillResponse } from '@vassembly/domain-skill';
import userDomain from '@vassembly/domain-user';
import { NotFoundError } from '@vassembly/errors';

import type { ArchiveSkillParams, ArchiveSkillResult } from './types';

export const archiveSkill = async (input: ArchiveSkillParams): Promise<ArchiveSkillResult> => {
  const { adminUserId, skillId } = input;

  await userDomain.queries.assertHasRole({ userId: adminUserId, role: AUTH_TOKEN_ROLE.ADMIN });

  try {
    await skillDomain.queries.getById({ id: skillId });
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError('Skill not found');
    }

    throw error;
  }

  const result = await skillDomain.commands.removeSoft({ id: skillId });

  return {
    skill: toSkillResponse({ skill: result.data }),
  };
};
