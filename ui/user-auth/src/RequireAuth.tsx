import { useMemo, ReactNode } from 'react';
import { useUserAuth } from './useUserAuth';
import { RequireAuthProps } from './types';
import { hasRoleAccess } from './requireAuthUtils';

export function RequireAuth({
  children,
  fallback,
  roles,
  match = 'any',
}: RequireAuthProps): ReactNode {
  const { isAuthenticated, role: userRole } = useUserAuth();

  const isAuthorized = useMemo(
    () =>
      isAuthenticated &&
      hasRoleAccess({
        userRole,
        requiredRoles: roles,
        match,
      }),
    [isAuthenticated, userRole, roles, match],
  );

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
