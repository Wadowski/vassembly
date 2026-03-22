import type { VerifyOptions } from 'jsonwebtoken';
import type { AuthTokenModel } from "../../model";

export type VerifyAuthTokenInput = {
  token: string;
  options?: VerifyOptions;
};

export type VerifyAuthTokenResult = Promise<AuthTokenModel>;
