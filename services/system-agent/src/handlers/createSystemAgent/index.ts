import systemAgentDomain, { toSystemAgentResponse } from '@vassembly/domain-system-agent';

import { assertAdminRole } from '../../helpers/assertAdminRole';

import type { CreateSystemAgentParams, CreateSystemAgentResult } from './types';

export const createSystemAgent = async (
  input: CreateSystemAgentParams,
): Promise<CreateSystemAgentResult> => {
  const { adminUserId, role, body } = input;

  assertAdminRole({ role });

  await systemAgentDomain.queries.assertUniqueActiveName({ name: body.name });

  const result = await systemAgentDomain.commands.create({
    ...body,
    createdByAdminId: adminUserId,
    updatedByAdminId: adminUserId,
  });

  return {
    systemAgent: toSystemAgentResponse({ systemAgent: result.data }),
  };
};
