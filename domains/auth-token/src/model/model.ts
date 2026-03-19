import { Model } from "@vassembly/model";

export class AuthTokenModel extends Model {
  token?: string;
  
  role?: string;

  userId?: string;

  refreshTokenId?: string;

  expiresAt?: Date;
}