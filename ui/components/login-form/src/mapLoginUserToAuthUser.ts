import type { AuthUser, MapLoginUserToAuthUserParams } from './types';

export const mapLoginUserToAuthUser = (params: MapLoginUserToAuthUserParams): AuthUser => {
  const { id, email, firstName, lastName, role } = params;
  return { id, email, firstName, lastName, role };
};
