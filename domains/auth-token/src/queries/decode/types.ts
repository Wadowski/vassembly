import type { AuthTokenModel } from "../../model";

export type DecodeAuthTokenInput = {
  token: string;
};

export type DecodeAuthTokenResult = AuthTokenModel | null;
