import { createContext } from 'react';
import { UserAuthContextValue } from './types';

export const UserAuthContext = createContext<UserAuthContextValue | undefined>(undefined);

UserAuthContext.displayName = 'UserAuthContext';
