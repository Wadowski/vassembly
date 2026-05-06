export interface UserPublicResponse {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  verifiedAt?: Date | null;
}
