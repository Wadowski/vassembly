import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import systemAgentDomain, { toSystemAgentResponse } from '@vassembly/domain-system-agent';
import userDomain from '@vassembly/domain-user';
import { NotFoundError } from '@vassembly/errors';

import { validateAssignedToolIds } from '../../helpers/validateAssignedToolIds';

import type { UpdateSystemAgentParams, UpdateSystemAgentResult } from './types';

export const updateSystemAgent = async (
  input: UpdateSystemAgentParams,
): Promise<UpdateSystemAgentResult> => {
  const { adminUserId, systemAgentId, body } = input;

  await userDomain.queries.assertHasRole({ userId: adminUserId, role: AUTH_TOKEN_ROLE.ADMIN });

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

  if (body.assignedToolIds !== undefined) {
    await validateAssignedToolIds({
      assignedToolIds: body.assignedToolIds,
      agentType: 'system',
    });
  }

  const result = await systemAgentDomain.commands.update({
    id: systemAgentId,
    updatedByAdminId: adminUserId,
    data: body,
  });

  return {
    systemAgent: toSystemAgentResponse({ systemAgent: result.data }),
  };
};
