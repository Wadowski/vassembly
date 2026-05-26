import systemAgentDomain from '@vassembly/domain-system-agent';
import { ForbiddenError, NotFoundError } from '@vassembly/errors';

import { assertAdminRole } from '../../helpers/assertAdminRole';
import { toPreferenceResponse } from '../../helpers/toPreferenceResponse';

import type { GetConnectionPreferenceParams, GetConnectionPreferenceResult } from './types';

export const getConnectionPreference = async (
  input: GetConnectionPreferenceParams,
): Promise<GetConnectionPreferenceResult> => {
  const { userId, role, targetUserId } = input;

  if (targetUserId !== undefined && targetUserId !== userId) {
    assertAdminRole({ role });
  }

  const result = await systemAgentDomain.queries.getPreferenceByUserId({ userId });

  if (!result.data) {
    throw new NotFoundError('System agent connection preference not found');
  }

  return {
    preference: toPreferenceResponse({ preference: result.data }),
  };
};
