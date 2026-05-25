import systemAgentDomain, { AgentStatus } from '@vassembly/domain-system-agent';
import { NotFoundError, WrongParamError } from '@vassembly/errors';

import { assertAdminRole } from '../../helpers/assertAdminRole';
import { mapAdminResponse } from '../../helpers/mapAdminResponse';

import type { RestoreSystemAgentParams, RestoreSystemAgentResult } from './types';

export const restoreSystemAgent = async (
  input: RestoreSystemAgentParams,
): Promise<RestoreSystemAgentResult> => {
  const { adminUserId, role, systemAgentId } = input;

  assertAdminRole({ role });

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
    systemAgent: mapAdminResponse(result.data),
  };
};
