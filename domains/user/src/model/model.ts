import { Model } from '@vassembly/model';

import type { AUTH_TOKEN_ROLE } from '@vassembly/constants';

export class UserModel extends Model {
  role?: AUTH_TOKEN_ROLE;

  email?: string;

  passwordHash?: string;

  firstName?: string;

  lastName?: string;

  verifiedAt?: Date | null;

  passwordResetToken?: string | null;

  passwordResetExpiresAt?: Date | null;

  onboarding?: {
    version: number;
    startedAt?: Date;
    completedAt?: Date | null;
  };

  emailVerificationToken?: string | null;

  emailVerificationExpiresAt?: Date | null;

  emailVerificationIssuedAt?: Date | null;
}
