import systemAgentDomain from '@vassembly/domain-system-agent';
import { NotFoundError } from '@vassembly/errors';

import { assertAdminRole } from '../../helpers/assertAdminRole';
import { mapAdminResponse } from '../../helpers/mapAdminResponse';

import type { ArchiveSystemAgentParams, ArchiveSystemAgentResult } from './types';

export const archiveSystemAgent = async (
  input: ArchiveSystemAgentParams,
): Promise<ArchiveSystemAgentResult> => {
  const { adminUserId, role, systemAgentId } = input;

  assertAdminRole({ role });

  const existing = await systemAgentDomain.queries.getById({ id: systemAgentId });

  if (!existing.data) {
    throw new NotFoundError('System agent not found');
  }

  const result = await systemAgentDomain.commands.removeSoft({
    id: systemAgentId,
    updatedByAdminId: adminUserId,
  });

  return {
    systemAgent: mapAdminResponse(result.data),
  };
};
