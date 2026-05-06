import { encode, hash } from "@vassembly/client-encoder";
import { validatorFactory } from "@vassembly/validation";
import { getDbById } from "@vassembly/queries";
import { NotFoundError, UnauthorizedError, WrongParamError } from "@vassembly/errors";

import { userMongodbDao } from "../../clients";
import { UserModel, userFactory } from "../../model";
import { PASSWORD_VALIDATION_SCHEMA } from "../create/constants";
import { USER_ID_VALIDATION_SCHEMA } from "../userIdValidationSchema";
import type { CompletePasswordResetCommand } from "./types";

const validatePasswordShape = validatorFactory(PASSWORD_VALIDATION_SCHEMA);
const getUserById = getDbById<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
});

export const completePasswordReset = async ({
  userId,
  plainToken,
  newPassword,
}: CompletePasswordResetCommand): Promise<{ data: UserModel }> => {
  const queryInstance = userFactory.create(
    { id: userId },
    { validationSchema: USER_ID_VALIDATION_SCHEMA },
  );
  queryInstance.isValid({ shouldThrow: true });

  if (!plainToken) {
    throw new WrongParamError("Reset token is required");
  }

  const validation = validatePasswordShape({ password: newPassword });
  if (!validation.success) {
    throw validation.error;
  }

  const stored = await userMongodbDao.get(queryInstance);
  if (!stored) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  const user = userFactory.create(stored);

  if (user.removedAt) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  if (!user.passwordResetToken) {
    throw new WrongParamError("No password reset in progress");
  }

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
    throw new UnauthorizedError("Password reset token has expired");
  }

  const encodedToken = encode(plainToken);

  if (encodedToken !== user.passwordResetToken) {
    throw new UnauthorizedError("Invalid password reset token");
  }

  const passwordHash = await hash({ text: newPassword });

  await userMongodbDao.update(
    queryInstance,
    userFactory.create({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    }),
  );

  const refreshed = await getUserById({ id: userId });
  if (refreshed.data) {
    delete refreshed.data.passwordHash;
  }
  return refreshed;
};
