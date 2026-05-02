import { Model } from "@vassembly/model";
import { AuthTokenRole } from "./enums";

export class AuthTokenModel extends Model {
  token?: string;

  role?: AuthTokenRole;
  
  userId?: string;
  
  refreshTokenId?: string;
  
  expiresAt?: Date;
}