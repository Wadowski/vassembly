import type { SignOptions } from 'jsonwebtoken';
import type { AuthTokenModel } from "../../model";

export type CreateAuthTokenInput = {
  role: 'user' | 'admin';
  userId: string;
  refreshTokenId: string;
  onboardingCompleted?: boolean;
};

export type CreateAuthTokenArgs = {
  input: CreateAuthTokenInput;
  options?: SignOptions;
};

export type AuthTokenResponse = Promise<AuthTokenModel>;
