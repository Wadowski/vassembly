export interface UserPublicResponse {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  removedAt?: string | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  verifiedAt?: string | null;
}
