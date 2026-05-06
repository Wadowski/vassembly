import { factory } from "@vassembly/model";
import { UserModel, UserPublicResponse } from "./model";

export const userFactory = factory(UserModel);

const removeSensitiveFields = (instance: UserModel): void => {
  delete instance.passwordHash;
  delete instance.passwordResetToken;
  delete instance.passwordResetExpiresAt;
};

export const createUserFactory = (options: { includePasswordHash?: boolean } = {}) => {
  const { includePasswordHash = false } = options;

  const toPublicResponse = (user: UserModel): UserPublicResponse => ({
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    removedAt: user.removedAt,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    verifiedAt: user.verifiedAt,
  });

  return {
    create: (data: Partial<UserModel>) => {
      const instance = userFactory.create(data);
      if (!includePasswordHash) {
        removeSensitiveFields(instance);
      }
      return instance;
    },
    createMany: (data: Array<Partial<UserModel>>) => {
      return data.map((item) => {
        const instance = userFactory.create(item);
        if (!includePasswordHash) {
          removeSensitiveFields(instance);
        }
        return instance;
      });
    },
    toPublicResponse,
  };
};
