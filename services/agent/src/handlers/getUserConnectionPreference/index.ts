import systemAgentDomain from '@vassembly/domain-system-agent';
import { NotFoundError } from '@vassembly/errors';

import { toPreferenceResponse } from '../../helpers/toPreferenceResponse';

import type {
  GetUserConnectionPreferenceParams,
  GetUserConnectionPreferenceResult,
} from './types';

export const getUserConnectionPreference = async (
  input: GetUserConnectionPreferenceParams,
): Promise<GetUserConnectionPreferenceResult> => {
  const { targetUserId } = input;

  const result = await systemAgentDomain.queries.getPreferenceByUserId({
    userId: targetUserId,
  });

  if (!result.data) {
    throw new NotFoundError('System agent connection preference not found');
  }

  return {
    preference: toPreferenceResponse({ preference: result.data }),
  };
};
