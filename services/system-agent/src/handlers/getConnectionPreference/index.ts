import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import userDomain from '@vassembly/domain-user';
import { NotFoundError } from '@vassembly/errors';

import { toPreferenceResponse } from '../../helpers/toPreferenceResponse';

import type { GetConnectionPreferenceParams, GetConnectionPreferenceResult } from './types';

export const getConnectionPreference = async (
  input: GetConnectionPreferenceParams,
): Promise<GetConnectionPreferenceResult> => {
  const { userId, targetUserId } = input;
  const effectiveUserId = targetUserId ?? userId;

  if (effectiveUserId !== userId) {
    await userDomain.queries.assertHasRole({ userId, role: AUTH_TOKEN_ROLE.ADMIN });
  }

  const result = await systemAgentDomain.queries.getPreferenceByUserId({
    userId: effectiveUserId,
  });

  if (!result.data) {
    throw new NotFoundError('System agent connection preference not found');
  }

  return {
    preference: toPreferenceResponse({ preference: result.data }),
  };
};
