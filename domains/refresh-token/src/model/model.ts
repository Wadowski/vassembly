import { Model } from "@vassembly/model";
import { MongoDbOmit } from "@vassembly/model";

export class RefreshTokenModel extends Model {
  userId?: string;

  tokenHash?: string;

  @MongoDbOmit
  token?: string;

  description?: string;

  expiresAt?: Date;

  revokedAt?: Date | null;

  replacedByRefreshTokenId?: string | null;
}
