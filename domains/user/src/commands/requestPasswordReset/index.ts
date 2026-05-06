import { encode } from "@vassembly/client-encoder";
import { NotFoundError, WrongParamError } from "@vassembly/errors";

import { userMongodbDao } from "../../clients";
import { userFactory } from "../../model";
import { USER_ID_VALIDATION_SCHEMA } from "../userIdValidationSchema";
import { PASSWORD_RESET_TOKEN_TTL_MS } from "./constants";
import type { RequestPasswordResetCommand } from "./types";

export const requestPasswordReset = async ({
  userId,
  token,
}: RequestPasswordResetCommand): Promise<void> => {
  const queryInstance = userFactory.create(
    { id: userId },
    { validationSchema: USER_ID_VALIDATION_SCHEMA },
  );
  queryInstance.isValid({ shouldThrow: true });

  if (!token) {
    throw new WrongParamError("Reset token is required");
  }

  const existing = await userMongodbDao.get(queryInstance);
  if (!existing) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  const userRecord = userFactory.create(existing);
  if (userRecord.removedAt) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  const passwordResetToken = encode(token);
  const passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await userMongodbDao.update(
    queryInstance,
    userFactory.create({ passwordResetToken, passwordResetExpiresAt }),
  );
};
