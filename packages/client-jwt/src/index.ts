import { sign as signToken, verify as verifyToken, decode as decodeToken } from 'jsonwebtoken';
import type { SignOptions, JwtPayload } from 'jsonwebtoken';
import { config } from '@vassembly/config';
import { CreateTokenArgs, VerifyTokenArgs, JwtTokenData } from './types';
import { UnauthorizedError } from '@vassembly/errors';

const { secret } = config.jwt;

export const create = async ({ data, options }: CreateTokenArgs): Promise<string> => {
  if (!secret) {
    throw new UnauthorizedError('JWT secret is not configured');
  }

  const defaultOptions: SignOptions = {
    algorithm: 'HS256',
    ...options,
  };
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    ...data,
  };

  return signToken(payload, secret, defaultOptions);
};

export const verify = async ({ token, options }: VerifyTokenArgs): Promise<JwtTokenData> => {
  if (!secret) {
    throw new UnauthorizedError('JWT secret is not configured');
  }

  try {
    const result = await verifyToken(token, secret, options) as JwtTokenData;
    return result;
  } catch {
    throw new UnauthorizedError('Invalid token');
  }
};

export const decode = async (token: string): Promise<JwtPayload | null> => {
  return decodeToken(token) as JwtPayload | null;
};
