import { UserRole } from './types';

export interface HasRoleAccessParams {
  userRole: UserRole;
  requiredRoles?: UserRole[];
  match?: 'any' | 'all';
}

export function hasRoleAccess({
  userRole,
  requiredRoles,
  match = 'any',
}: HasRoleAccessParams): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (match === 'any') {
    return requiredRoles.some((role) => userRole === role);
  }

  return requiredRoles.every((role) => userRole === role);
}
