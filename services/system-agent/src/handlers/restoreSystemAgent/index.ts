import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import systemAgentDomain, { AgentStatus, toSystemAgentResponse } from '@vassembly/domain-system-agent';
import userDomain from '@vassembly/domain-user';
import { NotFoundError, WrongParamError } from '@vassembly/errors';

import type { RestoreSystemAgentParams, RestoreSystemAgentResult } from './types';

export const restoreSystemAgent = async (
  input: RestoreSystemAgentParams,
): Promise<RestoreSystemAgentResult> => {
  const { adminUserId, systemAgentId } = input;

  await userDomain.queries.assertHasRole({ userId: adminUserId, role: AUTH_TOKEN_ROLE.ADMIN });

  const existing = await systemAgentDomain.queries.getById({ id: systemAgentId });

  if (!existing.data) {
    throw new NotFoundError('System agent not found');
  }

  const isArchived =
    existing.data.status === AgentStatus.Archived || existing.data.removedAt !== null;

  if (!isArchived) {
    throw new WrongParamError('System agent is not archived');
  }

  const result = await systemAgentDomain.commands.restore({
    id: systemAgentId,
    restoredByAdminId: adminUserId,
  });

  return {
    systemAgent: toSystemAgentResponse({ systemAgent: result.data }),
  };
};
