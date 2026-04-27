import { useCallback, useMemo, useState } from 'react';
import { UserAuthContext } from './UserAuthContext';
import { UserAuthContextValue, UserAuthProviderProps, SetSessionParams, AuthStatus } from './types';

export function UserAuthProvider({
  children,
  initialState,
}: UserAuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>(initialState?.status ?? 'unauthenticated');
  const [user, setUser] = useState(initialState?.user ?? null);
  const [roles, setRoles] = useState(initialState?.roles ?? []);

  const handleSetSession = useCallback((params: SetSessionParams) => {
    setUser(params.user);
    setRoles(params.user.roles ?? []);
    setStatus('authenticated');
  }, []);

  const handleClearSession = useCallback(() => {
    setUser(null);
    setRoles([]);
    setStatus('unauthenticated');
  }, []);

  const handleSetStatus = useCallback((newStatus: AuthStatus) => {
    setStatus(newStatus);
  }, []);

  const value: UserAuthContextValue = useMemo(
    () => ({
      status,
      user,
      roles,
      isAuthenticated: status === 'authenticated',
      setSession: handleSetSession,
      clearSession: handleClearSession,
      setStatus: handleSetStatus,
    }),
    [status, user, roles, handleSetSession, handleClearSession, handleSetStatus],
  );

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}
