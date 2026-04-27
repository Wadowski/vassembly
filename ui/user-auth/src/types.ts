export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type UserId = string;

export interface AuthUser {
  id: UserId;
  email?: string;
  roles?: UserRole[];
}

export type UserRole = string;

export interface SetSessionParams {
  user: AuthUser;
  status?: 'authenticated';
}

export interface UserAuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  roles: UserRole[];
  isAuthenticated: boolean;
  setSession: (params: SetSessionParams) => void;
  clearSession: () => void;
  setStatus: (status: AuthStatus) => void;
}

export interface UserAuthProviderProps {
  children: React.ReactNode;
  initialState?: Partial<Pick<UserAuthContextValue, 'status' | 'user' | 'roles'>>;
}

export interface RequireAuthProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  roles?: UserRole[];
  match?: 'any' | 'all';
  loading?: React.ReactNode;
  showFallbackWhenLoading?: boolean;
}
