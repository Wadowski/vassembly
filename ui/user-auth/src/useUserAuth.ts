import { useContext } from 'react';
import { UserAuthContext } from './UserAuthContext';
import { UserAuthContextValue } from './types';

export function useUserAuth(): UserAuthContextValue {
  const context = useContext(UserAuthContext);

  if (context === undefined) {
    throw new Error(
      'useUserAuth must be used within a UserAuthProvider. Wrap your component tree with <UserAuthProvider>.',
    );
  }

  return context;
}
