export interface AuthInput {
  authToken: string;
  refreshToken: string;
}

export interface AuthPublicUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  verifiedAt?: string;
  role?: string;
}

export interface AuthOutput {
  authToken: string;
  refreshToken: string;
  user: AuthPublicUser;
}
