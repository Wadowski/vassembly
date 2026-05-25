import systemAgentDomain from '@vassembly/domain-system-agent';
import { ForbiddenError, NotFoundError } from '@vassembly/errors';

import { toPreferenceResponse } from '../../helpers/toPreferenceResponse';

import type { GetConnectionPreferenceParams, GetConnectionPreferenceResult } from './types';

export const getConnectionPreference = async (
  input: GetConnectionPreferenceParams,
): Promise<GetConnectionPreferenceResult> => {
  const { userId, targetUserId } = input;

  if (targetUserId !== undefined && targetUserId !== userId) {
    throw new ForbiddenError('Cannot read another user preference');
  }

  const result = await systemAgentDomain.queries.getPreferenceByUserId({ userId });

  if (!result.data) {
    throw new NotFoundError('System agent connection preference not found');
  }

  return {
    preference: toPreferenceResponse({ preference: result.data }),
  };
};
