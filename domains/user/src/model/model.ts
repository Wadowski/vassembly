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
