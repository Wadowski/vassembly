export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type UserId = string;

export interface AuthUser {
  id: UserId;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  verifiedAt?: Date;
}

export type UserRole = string;

export interface SetSessionParams {
  user: AuthUser;
  status?: 'authenticated';
}

export interface UserAuthContextValue {
  status: boolean;
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  setSession: (params: SetSessionParams) => void;
  clearSession: () => void;
  setStatus: (status: boolean) => void;
}

export interface UserAuthProviderProps {
  children: React.ReactNode;
  initialState?: Partial<Pick<UserAuthContextValue, 'status' | 'user' | 'role'>>;
}

export interface RequireAuthProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  roles?: UserRole[];
  match?: 'any' | 'all';
  loading?: React.ReactNode;
  showFallbackWhenLoading?: boolean;
}
