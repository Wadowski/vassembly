import type { AUTH_TOKEN_ROLE } from '@vassembly/constants';

export interface UserOnboardingResponse {
  version: number;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface UserPublicResponse {
  id?: string;
  role?: AUTH_TOKEN_ROLE;
  createdAt?: string;
  updatedAt?: string;
  removedAt?: string | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  verifiedAt?: string | null;
  onboarding?: UserOnboardingResponse;
}
