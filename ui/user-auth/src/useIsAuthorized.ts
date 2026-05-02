import { useMemo } from 'react';
import { useUserAuth } from './useUserAuth';
import { UserRole } from './types';
import { hasRoleAccess } from './requireAuthUtils';

export function useIsAuthorized(requiredRoles?: UserRole[], match: 'any' | 'all' = 'any'): boolean {
  const { isAuthenticated, role } = useUserAuth();

  return useMemo(
    () =>
      isAuthenticated &&
      hasRoleAccess({
        userRole: role,
        requiredRoles,
        match,
      }),
    [isAuthenticated, role, requiredRoles, match],
  );
}
