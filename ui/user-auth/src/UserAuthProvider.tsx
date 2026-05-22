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
  const [bootstrapLoading, setBootstrapLoading] = useState(true);

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

  const handleSetBootstrapLoading = useCallback((loading: boolean) => {
    setBootstrapLoading(loading);
  }, []);

  const value: UserAuthContextValue = useMemo(
    () => ({
      status,
      user,
      role,
      isAuthenticated: status,
      bootstrapLoading,
      setSession: handleSetSession,
      clearSession: handleClearSession,
      setStatus: handleSetStatus,
      setBootstrapLoading: handleSetBootstrapLoading,
    }),
    [status, user, role, bootstrapLoading, handleSetSession, handleClearSession, handleSetStatus, handleSetBootstrapLoading],
  );

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}
