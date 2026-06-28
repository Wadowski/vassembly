export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type UserId = string;

export interface AuthUser {
  id: UserId;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  verifiedAt?: Date;
  onboardingCompleted?: boolean;
  /** When true, hide password-change UI for SSO-managed accounts. */
  isSsoOnly?: boolean;
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
  bootstrapLoading: boolean;
  setSession: (params: SetSessionParams) => void;
  clearSession: () => void;
  setStatus: (status: boolean) => void;
  setBootstrapLoading: (loading: boolean) => void;
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
}
