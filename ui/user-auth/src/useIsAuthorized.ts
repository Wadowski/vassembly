import { useMemo } from 'react';
import { useUserAuth } from './useUserAuth';
import { UserRole } from './types';
import { hasRoleAccess } from './requireAuthUtils';

export function useIsAuthorized(requiredRoles?: UserRole[], match: 'any' | 'all' = 'any'): boolean {
  const { isAuthenticated, roles } = useUserAuth();

  return useMemo(
    () =>
      isAuthenticated &&
      hasRoleAccess({
        userRoles: roles,
        requiredRoles,
        match,
      }),
    [isAuthenticated, roles, requiredRoles, match],
  );
}
