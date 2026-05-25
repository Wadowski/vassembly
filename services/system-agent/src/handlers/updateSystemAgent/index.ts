import systemAgentDomain from '@vassembly/domain-system-agent';
import { NotFoundError } from '@vassembly/errors';

import { assertAdminRole } from '../../helpers/assertAdminRole';
import { mapAdminResponse } from '../../helpers/mapAdminResponse';

import type { UpdateSystemAgentParams, UpdateSystemAgentResult } from './types';

export const updateSystemAgent = async (
  input: UpdateSystemAgentParams,
): Promise<UpdateSystemAgentResult> => {
  const { adminUserId, role, systemAgentId, body } = input;

  assertAdminRole({ role });

  const existing = await systemAgentDomain.queries.getById({ id: systemAgentId });

  if (!existing.data) {
    throw new NotFoundError('System agent not found');
  }

  if (body.name !== undefined) {
    await systemAgentDomain.queries.assertUniqueActiveName({
      name: body.name,
      excludeId: systemAgentId,
    });
  }

  const result = await systemAgentDomain.commands.update({
    id: systemAgentId,
    updatedByAdminId: adminUserId,
    data: body,
  });

  return {
    systemAgent: mapAdminResponse(result.data),
  };
};
