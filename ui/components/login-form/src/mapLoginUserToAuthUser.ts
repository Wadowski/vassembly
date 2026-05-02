import type { AuthUser, MapLoginUserToAuthUserParams } from './types';

export const mapLoginUserToAuthUser = (params: MapLoginUserToAuthUserParams): AuthUser => {
  const { id, email, firstName, lastName } = params;
  return { id, email, firstName, lastName };
};
