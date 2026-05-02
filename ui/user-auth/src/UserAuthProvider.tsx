import { useCallback, useMemo, useState } from 'react';
import { UserAuthContext } from './UserAuthContext';
import { UserAuthContextValue, UserAuthProviderProps, SetSessionParams } from './types';

export function UserAuthProvider({
  children,
  initialState,
}: UserAuthProviderProps) {
  const [status, setStatus] = useState(initialState?.status ?? false);
  const [user, setUser] = useState(initialState?.user ?? null);
  const [role, setRole] = useState(initialState?.role ?? '');

  const handleSetSession = useCallback((params: SetSessionParams) => {
    setUser(params.user);
    setRole(params.user.role ?? '');
    setStatus(true);
  }, []);

  const handleClearSession = useCallback(() => {
    setUser(null);
    setRole('');
    setStatus(false);
  }, []);

  const handleSetStatus = useCallback((newStatus: boolean) => {
    setStatus(newStatus);
  }, []);

  const value: UserAuthContextValue = useMemo(
    () => ({
      status,
      user,
      role,
      isAuthenticated: status,
      setSession: handleSetSession,
      clearSession: handleClearSession,
      setStatus: handleSetStatus,
    }),
    [status, user, role, handleSetSession, handleClearSession, handleSetStatus],
  );

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}
