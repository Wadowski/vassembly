import { toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { UserPublicResponse } from './dto';
import type { UserModel } from './model';

export interface ToUserPublicResponseParams {
  user: UserModel;
}

export const toUserPublicResponse = ({
  user,
}: ToUserPublicResponseParams): UserPublicResponse => ({
  id: user.id,
  createdAt: user.createdAt
    ? toIsoString({ value: user.createdAt, fieldName: 'createdAt' })
    : undefined,
  updatedAt: user.updatedAt
    ? toIsoString({ value: user.updatedAt, fieldName: 'updatedAt' })
    : undefined,
  removedAt: user.removedAt === undefined ? undefined : toNullableIsoString(user.removedAt),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  verifiedAt: user.verifiedAt === undefined ? undefined : toNullableIsoString(user.verifiedAt),
  onboarding:
    user.onboarding === undefined
      ? undefined
      : {
          version: user.onboarding.version,
          startedAt:
            user.onboarding.startedAt === undefined
              ? undefined
              : toNullableIsoString(user.onboarding.startedAt),
          completedAt:
            user.onboarding.completedAt === undefined
              ? undefined
              : toNullableIsoString(user.onboarding.completedAt),
        },
});
