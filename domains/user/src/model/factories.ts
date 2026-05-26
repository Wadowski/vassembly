import { factory } from "@vassembly/model";
import { UserModel } from "./model";

export const userFactory = factory(UserModel);

const removeSensitiveFields = (instance: UserModel): void => {
  delete instance.passwordHash;
  delete instance.passwordResetToken;
  delete instance.passwordResetExpiresAt;
};

export interface CreateUserFactoryParams {
  includePasswordHash?: boolean;
}

export const createUserFactory = ({ includePasswordHash = false }: CreateUserFactoryParams = {}) => ({
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
});
