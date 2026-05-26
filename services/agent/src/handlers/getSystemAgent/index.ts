import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import userDomain from '@vassembly/domain-user';
import { NotFoundError } from '@vassembly/errors';

import type { GetSystemAgentParams, GetSystemAgentResult } from './types';

export const getSystemAgent = async (
  input: GetSystemAgentParams,
): Promise<GetSystemAgentResult> => {
  const { adminUserId, systemAgentId } = input;

  await userDomain.queries.assertHasRole({ userId: adminUserId, role: AUTH_TOKEN_ROLE.ADMIN });

  const result = await systemAgentDomain.queries.getById({ id: systemAgentId });

  if (!result.data) {
    throw new NotFoundError('System agent not found');
  }

  return {
    systemAgent: result.data,
  };
};
