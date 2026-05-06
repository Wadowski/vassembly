import * as authTokenDomain from "@vassembly/domain-auth-token";
import * as refreshTokenDomain from "@vassembly/domain-refresh-token";
import userDomain from "@vassembly/domain-user";
import { InternalError, NotFoundError } from "@vassembly/errors";

import type { AuthInput, AuthOutput, AuthPublicUser } from "./types";

const mapUserToAuthPublicUser = (user: {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  verifiedAt?: Date | null;
}, verifiedToken: {
  role?: string;
}): AuthPublicUser => {
  if (!user.id) {
    throw new InternalError("User record missing id");
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    verifiedAt:
      user.verifiedAt instanceof Date ? user.verifiedAt.toISOString() : undefined,
    role: verifiedToken.role,
  };
};

export const auth = async (input: AuthInput): Promise<AuthOutput> => {
  const { authToken, refreshToken } = input;

  const verifiedToken = await authTokenDomain.queries.verify({ token: authToken });
  if (!verifiedToken.userId || !verifiedToken.role || !verifiedToken.refreshTokenId) {
    throw new InternalError("Failed to verify auth token");
  }

  const userResult = await userDomain.queries.getById({ id: verifiedToken.userId });
  if (!userResult.data) {
    throw new NotFoundError("User not found");
  }

  const newRefreshToken = await refreshTokenDomain.commands.refresh({ refreshToken });
  if (!newRefreshToken.id || !newRefreshToken.token) {
    throw new InternalError("Failed to refresh a refresh token");
  }

  const newAuthToken = await authTokenDomain.commands.create({
    input: {
      userId: verifiedToken.userId,
      refreshTokenId: newRefreshToken.id,
      role: verifiedToken.role,
    },
  });

  if (!newAuthToken.token) {
    throw new InternalError("Failed to create auth token");
  }

  return {
    authToken: newAuthToken.token,
    refreshToken: newRefreshToken.token,
    user: mapUserToAuthPublicUser(userResult.data, verifiedToken),
  };
};
