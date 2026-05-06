import { Model } from "@vassembly/model";

export class UserModel extends Model {
  email?: string;

  passwordHash?: string;

  firstName?: string;

  lastName?: string;

  verifiedAt?: Date | null;

  passwordResetToken?: string | null;

  passwordResetExpiresAt?: Date | null;
}

export interface UserPublicResponse {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  verifiedAt?: Date | null;
}
