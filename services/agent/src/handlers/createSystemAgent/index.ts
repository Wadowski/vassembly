import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import systemAgentDomain, { toSystemAgentResponse } from '@vassembly/domain-system-agent';
import userDomain from '@vassembly/domain-user';

import { validateAssignedToolIds } from '../../helpers/validateAssignedToolIds';

import type { CreateSystemAgentParams, CreateSystemAgentResult } from './types';

export const createSystemAgent = async (
  input: CreateSystemAgentParams,
): Promise<CreateSystemAgentResult> => {
  const { adminUserId, body } = input;

  await userDomain.queries.assertHasRole({ userId: adminUserId, role: AUTH_TOKEN_ROLE.ADMIN });

  await systemAgentDomain.queries.assertUniqueActiveName({ name: body.name });

  if (body.assignedToolIds !== undefined) {
    await validateAssignedToolIds({
      assignedToolIds: body.assignedToolIds,
      agentType: 'system',
    });
  }

  const result = await systemAgentDomain.commands.create({
    ...body,
    createdByAdminId: adminUserId,
    updatedByAdminId: adminUserId,
  });

  return {
    systemAgent: toSystemAgentResponse({ systemAgent: result.data }),
  };
};
