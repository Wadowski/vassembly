import { UserRole } from './types';

export interface HasRoleAccessParams {
  userRoles: UserRole[];
  requiredRoles?: UserRole[];
  match?: 'any' | 'all';
}

export function hasRoleAccess({
  userRoles,
  requiredRoles,
  match = 'any',
}: HasRoleAccessParams): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (match === 'any') {
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  return requiredRoles.every((role) => userRoles.includes(role));
}
