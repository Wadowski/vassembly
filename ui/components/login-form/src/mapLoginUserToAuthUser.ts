import type { AuthUser, MapLoginUserToAuthUserParams } from './types';

export const mapLoginUserToAuthUser = (params: MapLoginUserToAuthUserParams): AuthUser => {
  const { id, email } = params;
  return { id, email };
};
