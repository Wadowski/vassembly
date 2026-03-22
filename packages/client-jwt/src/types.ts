import { SignOptions, VerifyOptions } from 'jsonwebtoken';

export interface JwtTokenData extends Record<string, unknown> {
  sub?: string;
  iat?: number;
  exp?: number;
}

export interface CreateTokenArgs {
  data: JwtTokenData;
  options?: SignOptions;
}

export interface VerifyTokenArgs {
  token: string;
  options?: VerifyOptions;
}