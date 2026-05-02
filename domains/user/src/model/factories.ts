import { factory, translationFactory } from "@vassembly/model";
import { UserModel } from "./model";

export const userFactory = factory(UserModel);

const removePasswordHash = (instance: UserModel): void => {
  delete instance.passwordHash;
};

export const createUserFactory = (options: { includePasswordHash?: boolean } = {}) => {
  const { includePasswordHash = false } = options;

  return {
    create: (data: Partial<UserModel>) => {
      const instance = userFactory.create(data);
      if (!includePasswordHash) {
        removePasswordHash(instance);
      }
      return instance;
    },
    createMany: (data: Array<Partial<UserModel>>) => {
      return data.map((item) => {
        const instance = userFactory.create(item);
        if (!includePasswordHash) {
          removePasswordHash(instance);
        }
        return instance;
      });
    },
  };
};
