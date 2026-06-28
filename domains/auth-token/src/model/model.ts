import { Model } from "@vassembly/model";

import type { AUTH_TOKEN_ROLE } from "@vassembly/constants";

export class AuthTokenModel extends Model {
  token?: string;

  role?: AUTH_TOKEN_ROLE;
  
  userId?: string;
  
  refreshTokenId?: string;

  onboardingCompleted?: boolean;
  
  expiresAt?: Date;
}