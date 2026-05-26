import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import systemAgentDomain, { toSystemAgentResponse } from '@vassembly/domain-system-agent';
import userDomain from '@vassembly/domain-user';
import { NotFoundError } from '@vassembly/errors';

import type { ArchiveSystemAgentParams, ArchiveSystemAgentResult } from './types';

export const archiveSystemAgent = async (
  input: ArchiveSystemAgentParams,
): Promise<ArchiveSystemAgentResult> => {
  const { adminUserId, systemAgentId } = input;

  await userDomain.queries.assertHasRole({ userId: adminUserId, role: AUTH_TOKEN_ROLE.ADMIN });

  const existing = await systemAgentDomain.queries.getById({ id: systemAgentId });

  if (!existing.data) {
    throw new NotFoundError('System agent not found');
  }

  const result = await systemAgentDomain.commands.removeSoft({
    id: systemAgentId,
    updatedByAdminId: adminUserId,
  });

  return {
    systemAgent: toSystemAgentResponse({ systemAgent: result.data }),
  };
};
