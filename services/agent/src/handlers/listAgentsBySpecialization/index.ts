import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import userDomain from '@vassembly/domain-user';

import type {
  ListAgentsBySpecializationParams,
  ListAgentsBySpecializationResult,
} from './types';

export const listAgentsBySpecialization = async (
  input: ListAgentsBySpecializationParams,
): Promise<ListAgentsBySpecializationResult> => {
  const { adminUserId, specializationId, page, size, search } = input;

  await userDomain.queries.assertHasRole({ userId: adminUserId, role: AUTH_TOKEN_ROLE.ADMIN });

  const result = await systemAgentDomain.queries.getListBySpecializationId({
    specializationId,
    page,
    size,
    search,
  });

  return {
    items: result.items,
    total: result.totalCount,
    page: result.page,
    size: result.size,
  };
};
