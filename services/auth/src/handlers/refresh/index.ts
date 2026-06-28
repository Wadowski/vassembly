import * as refreshTokenDomain from '@vassembly/domain-refresh-token';
import * as authTokenDomain from '@vassembly/domain-auth-token';
import userDomain from '@vassembly/domain-user';
import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import { InternalError } from '@vassembly/errors';

import { deriveOnboardingCompleted } from '../../utils/deriveOnboardingCompleted';
import type { RefreshInput } from './types';

export interface RefreshOutput {
  authToken: string;
  refreshToken: string;
}

export const refresh = async (input: RefreshInput): Promise<RefreshOutput> => {
  const { refreshToken } = input;

  const newRefreshToken = await refreshTokenDomain.commands.refresh({ refreshToken });
  if (!newRefreshToken.id || !newRefreshToken.token || !newRefreshToken.userId) {
    throw new InternalError('Failed to refresh token');
  }

  const userResult = await userDomain.queries.getModelById({ id: newRefreshToken.userId });
  const role = userResult.data.role ?? AUTH_TOKEN_ROLE.USER;
  const onboardingCompleted = deriveOnboardingCompleted({ user: userResult.data });

  const authToken = await authTokenDomain.commands.create({
    input: {
      userId: newRefreshToken.userId,
      refreshTokenId: newRefreshToken.id,
      role,
      onboardingCompleted,
    },
  });

  if (!authToken.token) {
    throw new InternalError('Failed to create auth token');
  }

  return {
    authToken: authToken.token,
    refreshToken: newRefreshToken.token,
  };
};
