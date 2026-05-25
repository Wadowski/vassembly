import systemAgentDomain from '@vassembly/domain-system-agent';
import { NotFoundError } from '@vassembly/errors';

import { assertAdminRole } from '../../helpers/assertAdminRole';
import { mapAdminResponse } from '../../helpers/mapAdminResponse';

import type { GetSystemAgentParams, GetSystemAgentResult } from './types';

export const getSystemAgent = async (
  input: GetSystemAgentParams,
): Promise<GetSystemAgentResult> => {
  const { role, systemAgentId } = input;

  assertAdminRole({ role });

  const result = await systemAgentDomain.queries.getById({ id: systemAgentId });

  if (!result.data) {
    throw new NotFoundError('System agent not found');
  }

  return {
    systemAgent: mapAdminResponse(result.data),
  };
};
